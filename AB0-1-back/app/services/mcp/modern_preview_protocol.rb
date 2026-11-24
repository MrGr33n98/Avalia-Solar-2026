# frozen_string_literal: true

require 'base64'

module Mcp
  # Stateless 2026-07-28 protocol preview. No domain data is read and
  # tools/call is intentionally non-executable until OAuth and policy checks.
  # Used only by the separately feature-gated RemoteTransportController.
  class ModernPreviewProtocol
    VERSION = '2026-07-28'
    LEGACY_VERSION = '2025-11-25'
    HEADER_MISMATCH = -32_020
    UNSUPPORTED_VERSION = -32_022
    MAX_HEADER_LENGTH = 512

    def initialize(headers:, message:, auth_context: nil)
      @headers = headers
      @message = message
      @auth_context = auth_context
    end

    def response
      if @message['method'] == 'notifications/initialized' && !@message.key?('id')
        params = @message['params'] || {}
        canary_error = authorize_canary('notifications/initialized', params)
        return canary_error if canary_error

        return { status: :accepted, body: nil }
      end

      id = @message['id']
      return error(nil, -32_600, 'Invalid JSON-RPC request.', :bad_request) unless @message.key?('id')

      params = @message['params'] || {}
      metadata = params['_meta']
      return error(id, -32_602, 'Request metadata is required.', :bad_request) unless metadata.is_a?(Hash)
      unless metadata['io.modelcontextprotocol/clientCapabilities'].is_a?(Hash)
        return error(id, -32_602, 'Client capabilities are required.', :bad_request)
      end

      body_version = metadata['io.modelcontextprotocol/protocolVersion']
      header_version = @headers['MCP-Protocol-Version'].to_s
      unless body_version.is_a?(String) && header_version.present? && body_version == header_version
        return error(id, HEADER_MISMATCH, 'Protocol version header mismatch.', :bad_request)
      end
      unless header_version == VERSION
        return error(id, UNSUPPORTED_VERSION, 'Unsupported protocol version.', :bad_request,
                     supported: [VERSION, LEGACY_VERSION], requested: header_version)
      end

      method = @message.fetch('method')
      return error(id, HEADER_MISMATCH, 'Mcp-Method header mismatch.', :bad_request) unless @headers['Mcp-Method'].to_s == method

      if method == 'tools/call'
        tool_name = params['name']
        return error(id, -32_602, 'Tool name is required.', :bad_request) unless tool_name.is_a?(String)
        return error(id, HEADER_MISMATCH, 'Mcp-Name header mismatch.', :bad_request) unless validated_name_header?(@headers['Mcp-Name'].to_s, tool_name)
      end

      canary_error = authorize_canary(method, params)
      return canary_error if canary_error

      case method
      when 'server/discover'
        return error(id, -32_602, 'Unexpected discovery parameters.', :bad_request) unless (params.keys - ['_meta']).empty?

        capabilities = ::Mcp::Ui::ResourceRegistry.enabled? ? { tools: {}, resources: { listChanged: false } } : { tools: {} }
        success(id, {
          supportedVersions: [VERSION, LEGACY_VERSION],
          capabilities: capabilities,
          _meta: { 'io.modelcontextprotocol/serverInfo': { name: 'avalia-solar-mcp-preview', version: '0.2.0' } },
          instructions: 'Private preview only. Tool execution is disabled until OAuth authorization is implemented.',
          ttlMs: 0, cacheScope: 'private'
        })
      when 'tools/list'
        return error(id, -32_602, 'Unexpected list parameters.', :bad_request) unless (params.keys - %w[_meta cursor]).empty?
        return error(id, -32_602, 'Unsupported pagination cursor.', :bad_request) if params['cursor'].present?

        success(id, { tools: Mcp::PublicToolRegistry.list, ttlMs: 0, cacheScope: 'private' })
      when 'resources/list'
        handle_resources_list(id, params)
      when 'resources/read'
        handle_resources_read(id, params)
      when 'tools/call'
        return error(id, -32_001, 'Tool execution is unavailable in transport preview.') unless execution_authorized?

        begin
          data = ::Mcp::Public::Executor.call(
            name: params['name'], arguments: params.fetch('arguments', {}),
            principal: @auth_context.fetch(:subject)
          )
          data = ::Mcp::Public::OutputValidator.validate!(name: params['name'], payload: data)
          summary = ::Mcp::Ui::TextSummaryFormatter.call(name: params['name'], payload: data)
          payload = {
            content: [{ type: 'text', text: summary }],
            structuredContent: data, isError: false
          }
          ui_meta = ::Mcp::Ui::ResourceRegistry.tool_meta(params['name'])
          payload[:_meta] = ui_meta if ui_meta
          success(id, payload)
        rescue ::Mcp::Public::Executor::NotAvailable
          error(id, -32_001, 'Tool not yet available.')
        rescue ::Mcp::Public::InputValidator::Invalid
          error(id, -32_602, 'Invalid public tool arguments.', :bad_request)
        rescue ::Mcp::Public::DirectoryService::NotFound
          error(id, -32_602, 'Public company not found.', :not_found)
        rescue ::Mcp::Public::OutputValidator::Invalid
          error(id, -32_603, 'Public tool result validation failed.', :internal_server_error)
        end
      else
        error(id, -32_601, 'Method not found.', :not_found)
      end
    end

    private

    def handle_resources_list(id, params)
      return error(id, -32_601, 'Method not found.', :not_found) unless ::Mcp::Ui::ResourceRegistry.enabled?
      unless (params.keys - %w[_meta cursor]).empty?
        return error(id, -32_602, 'Unexpected resources/list parameters.', :bad_request)
      end

      success(id, { resources: ::Mcp::Ui::ResourceRegistry.list, ttlMs: 0, cacheScope: 'private' })
    end

    def handle_resources_read(id, params)
      return error(id, -32_601, 'Method not found.', :not_found) unless ::Mcp::Ui::ResourceRegistry.enabled?

      uri = params['uri']
      return error(id, -32_602, 'Resource URI is required.', :bad_request) unless uri.is_a?(String) && uri.present?

      content = ::Mcp::Ui::ResourceRegistry.read(uri)
      return error(id, -32_602, 'Resource not found.', :not_found) unless content

      success(id, { contents: [content], ttlMs: 0, cacheScope: 'private' })
    end

    def execution_authorized?
      return false if ::Mcp::Canary::Configuration.enforced? && !canary_authorized?('tools/call', @message.fetch('params', {}))

      ENV['MCP_PUBLIC_TOOLS_EXECUTION_ENABLED'] == 'true' &&
        ENV['MCP_REMOTE_POLICY_ENABLED'] == 'true' &&
        ENV['MCP_REMOTE_AUTH_MODE'] == 'oauth' &&
        ENV['MCP_REMOTE_OAUTH_ENABLED'] == 'true' &&
        @auth_context.is_a?(Hash) &&
        @auth_context[:subject].present? &&
        @auth_context[:client_id].present? &&
        Array(@auth_context[:scopes]).include?('mcp:public:read')
    end

    def authorize_canary(method, params)
      return nil unless ::Mcp::Canary::Configuration.enforced?

      ::Mcp::Canary::Guard.authorize!(
        method: method, tool_name: params['name'], auth_context: @auth_context
      )
      nil
    rescue ::Mcp::Canary::Guard::Failure => e
      return error(@message['id'], -32_001, 'MCP canary authorization denied.', :not_found) if e.type == :unavailable

      error(@message['id'], -32_001, 'MCP canary authorization denied.', :forbidden)
    end

    def canary_authorized?(method, params)
      ::Mcp::Canary::Guard.authorize!(
        method: method, tool_name: params['name'], auth_context: @auth_context
      )
      true
    rescue ::Mcp::Canary::Guard::Failure
      false
    end

    def validated_name_header?(raw_header, expected)
      return false if raw_header.empty? || raw_header.bytesize > MAX_HEADER_LENGTH

      decoded = if raw_header.start_with?('=?base64?') && raw_header.end_with?('?=')
                  encoded = raw_header[9...-2]
                  Base64.strict_decode64(encoded).force_encoding(Encoding::UTF_8)
                else
                  return false unless raw_header.ascii_only? && raw_header.match?(/\A[\x20-\x7e]+\z/)

                  raw_header
                end
      decoded.valid_encoding? && decoded == expected
    rescue ArgumentError
      false
    end

    def success(id, data)
      {
        status: :ok,
        body: { jsonrpc: '2.0', id: id, result: { resultType: 'complete' }.merge(data) }
      }
    end

    def error(id, code, message, status = :ok, data = nil)
      details = { code: code, message: message }
      details[:data] = data if data
      { status: status, body: { jsonrpc: '2.0', id: id, error: details } }
    end
  end
end
