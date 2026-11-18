# frozen_string_literal: true

require 'base64'

module Mcp
  module Private
    # Stateless MCP 2026-07-28 transport adapter for the PRIVATE resource.
    # Reuses the same authorized, quota-protected Executor as the legacy C3
    # handler; this class does not create or validate access tokens.
    class ModernProtocol
      VERSION = '2026-07-28'
      HEADER_MISMATCH = -32_020
      UNSUPPORTED_VERSION = -32_022
      MAX_HEADER_LENGTH = 512

      def initialize(headers:, message:, user:, auth_context:, remote_ip:)
        @headers = headers
        @message = message
        @user = user
        @auth_context = auth_context
        @remote_ip = remote_ip
      end

      def response
        return error(nil, -32_600, 'Invalid JSON-RPC request.', :bad_request) unless @message.is_a?(Hash)

        id = @message['id']
        unless @message['jsonrpc'] == '2.0' && (id.is_a?(Integer) || id.is_a?(String)) &&
               @message['method'].is_a?(String)
          return error(nil, -32_600, 'Invalid JSON-RPC request.', :bad_request)
        end

        params = @message.fetch('params', {})
        return error(id, -32_602, 'Parameters must be an object.', :bad_request) unless params.is_a?(Hash)

        meta = params['_meta']
        return error(id, -32_602, 'Request metadata is required.', :bad_request) unless meta.is_a?(Hash)
        unless meta['io.modelcontextprotocol/clientCapabilities'].is_a?(Hash) &&
               meta['io.modelcontextprotocol/clientInfo'].is_a?(Hash)
          return error(id, -32_602, 'Client metadata is required.', :bad_request)
        end

        header_version = @headers['MCP-Protocol-Version'].to_s
        body_version = meta['io.modelcontextprotocol/protocolVersion']
        unless header_version.present? && header_version == body_version
          return error(id, HEADER_MISMATCH, 'Protocol version header mismatch.', :bad_request)
        end
        unless header_version == VERSION
          return error(id, UNSUPPORTED_VERSION, 'Unsupported protocol version.', :bad_request,
                       supported: [VERSION], requested: header_version)
        end

        method = @message.fetch('method')
        return error(id, HEADER_MISMATCH, 'Mcp-Method header mismatch.', :bad_request) unless
          @headers['Mcp-Method'].to_s == method

        case method
        when 'server/discover'
          return error(id, -32_602, 'Unexpected discovery arguments.', :bad_request) unless
            (params.keys - ['_meta']).empty?

          success(id, {
            supportedVersions: [VERSION],
            capabilities: { tools: {} },
            _meta: { 'io.modelcontextprotocol/serverInfo' => {
              name: 'avalia-solar-mcp-private', version: '0.2.0'
            } },
            ttlMs: 0, cacheScope: 'private'
          })
        when 'tools/list'
          return error(id, -32_602, 'Unexpected list parameters.', :bad_request) unless
            (params.keys - ['_meta']).empty?

          success(id, { tools: [Protocol::TOOL], ttlMs: 0, cacheScope: 'private' })
        when 'ping'
          return error(id, -32_602, 'Unexpected ping parameters.', :bad_request) unless
            (params.keys - ['_meta']).empty?

          success(id, {})
        when 'tools/call'
          name = params['name']
          return error(id, -32_602, 'Tool name is required.', :bad_request) unless name.is_a?(String)
          return error(id, HEADER_MISMATCH, 'Mcp-Name header mismatch.', :bad_request) unless
            valid_name_header?(@headers['Mcp-Name'].to_s, name)
          return error(id, -32_602, 'Unexpected tool parameters.', :bad_request) unless
            (params.keys - %w[_meta name arguments]).empty?

          arguments = params.fetch('arguments', {})
          return error(id, -32_602, 'Tool arguments must be an object.', :bad_request) unless
            arguments.is_a?(Hash)

          # The legacy protocol already implements secure company selection,
          # Pundit authorization and canonical tenant quotas. Adapt its
          # response only; never introduce a second business dispatcher.
          outcome = Protocol.new(
            message: @message, user: @user, auth_context: @auth_context,
            remote_ip: @remote_ip
          ).response
          result = outcome[:body][:result]
          return outcome unless result

          outcome[:body][:result] = { resultType: 'complete' }.merge(result)
          outcome
        else
          error(id, -32_601, 'Method not found.', :not_found)
        end
      rescue StandardError => e
        Rails.logger.error("[MCP Private Modern] error=#{e.class}")
        error(nil, -32_603, 'Internal MCP error.', :internal_server_error)
      end

      private

      def valid_name_header?(header, name)
        return false if header.empty? || header.bytesize > MAX_HEADER_LENGTH

        value = if header.start_with?('=?base64?') && header.end_with?('?=')
                  Base64.strict_decode64(header[9...-2]).force_encoding(Encoding::UTF_8)
                else
                  return false unless header.ascii_only? && header.match?(/\A[\x20-\x7e]+\z/)

                  header
                end
        value.valid_encoding? && value == name
      rescue ArgumentError
        false
      end

      def success(id, data)
        { status: :ok, body: { jsonrpc: '2.0', id: id, result: { resultType: 'complete' }.merge(data) } }
      end

      def error(id, code, message, status = :ok, data = nil)
        details = { code: code, message: message }
        details[:data] = data if data
        { status: status, body: { jsonrpc: '2.0', id: id, error: details } }
      end
    end
  end
end
