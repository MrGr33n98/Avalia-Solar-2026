# frozen_string_literal: true

require 'base64'

module Mcp
  module Private
    # MCP private transport: 2026-07-28 stateless requests plus legacy C3 adapter.
    # The transport independently authenticates a Doorkeeper bearer; this layer
    # never reads a client-provided tenant as a grant of access.
    class Protocol
      VERSION = '2026-07-28'
      LEGACY_VERSION = '2025-11-25'
      HEADER_MISMATCH = -32_020
      MAX_HEADER_LENGTH = 512

      TOOL = {
        'name' => Executor::TOOL_NAME,
        'title' => 'Resumo da minha empresa',
        'description' => 'Consulta um resumo não sensível da empresa autorizada do usuário.',
        'inputSchema' => {
          'type' => 'object',
          'properties' => { 'company_id' => { 'type' => %w[integer string], 'minimum' => 1 } },
          'additionalProperties' => false
        },
        'annotations' => { 'readOnlyHint' => true, 'destructiveHint' => false, 'idempotentHint' => true }
      }.freeze

      def initialize(message:, user:, auth_context:, remote_ip:, headers: nil)
        @message = message
        @user = user
        @auth_context = auth_context
        @remote_ip = remote_ip
        @headers = headers || {}
      end

      def response
        id = @message.is_a?(Hash) ? @message['id'] : nil
        return error(nil, -32_600, 'Invalid JSON-RPC request.', :bad_request) unless valid_request?

        params = @message.fetch('params', {})
        return error(id, -32_602, 'Parameters must be an object.', :bad_request) unless params.is_a?(Hash)

        if modern_request?(params)
          modern_response(id, params)
        else
          legacy_dispatch(id)
        end
      rescue ::Mcp::RemoteQuotaPolicy::Failure => e
        if e.type == :rate_limited
          error(id, -32_029, 'Private MCP rate limit exceeded.', :too_many_requests, retry_after: e.retry_after)
        else
          error(id, -32_003, 'Private MCP quota service unavailable.', :service_unavailable)
        end
      rescue Mcp::Error => e
        error(id, -32_003, e.message)
      rescue Executor::InputError
        error(id, -32_602, 'Invalid private tool.', :bad_request)
      rescue StandardError => e
        Rails.logger.error("[MCP Private] request_id=#{RequestStore.store[:request_id]} error=#{e.class}")
        error(id, -32_603, 'Internal error.', :internal_server_error)
      end

      private

      def valid_request?
        @message.is_a?(Hash) && @message['jsonrpc'] == '2.0' &&
          @message.key?('id') && (@message['id'].is_a?(String) || @message['id'].is_a?(Integer)) &&
          @message['method'].is_a?(String)
      end

      def modern_request?(params)
        @headers['MCP-Protocol-Version'].to_s == VERSION ||
          @headers['Mcp-Method'].present? ||
          (params['_meta'].is_a?(Hash) && params['_meta'].key?('io.modelcontextprotocol/protocolVersion'))
      end

      def modern_response(id, params)
        meta = params['_meta']
        return error(id, -32_602, 'Request metadata is required.', :bad_request) unless meta.is_a?(Hash)
        unless meta['io.modelcontextprotocol/clientCapabilities'].is_a?(Hash)
          return error(id, -32_602, 'Client capabilities are required.', :bad_request)
        end

        body_version = meta['io.modelcontextprotocol/protocolVersion']
        header_version = @headers['MCP-Protocol-Version'].to_s
        unless body_version == VERSION && header_version == VERSION
          return error(id, HEADER_MISMATCH, 'Protocol version header mismatch.', :bad_request)
        end
        unless @headers['Mcp-Method'].to_s == @message['method']
          return error(id, HEADER_MISMATCH, 'Mcp-Method header mismatch.', :bad_request)
        end

        case @message['method']
        when 'server/discover'
          return error(id, -32_602, 'Unexpected discovery parameters.', :bad_request) unless (params.keys - ['_meta']).empty?

          complete(id, {
            supportedVersions: [VERSION, LEGACY_VERSION],
            capabilities: { tools: {} },
            _meta: { 'io.modelcontextprotocol/serverInfo': { name: 'avalia-solar-mcp-private', version: '0.2.0' } },
            instructions: 'Private, read-only company overview. Requires OAuth membership and entitlement.',
            ttlMs: 0, cacheScope: 'private'
          })
        when 'tools/list'
          return error(id, -32_602, 'Unexpected list parameters.', :bad_request) unless (params.keys - %w[_meta cursor]).empty?
          return error(id, -32_602, 'Unknown cursor.', :bad_request) if params['cursor'].present?

          complete(id, { tools: [TOOL], ttlMs: 0, cacheScope: 'private' })
        when 'tools/call'
          name = params['name']
          unless name.is_a?(String) && valid_name_header?(@headers['Mcp-Name'].to_s, name)
            return error(id, HEADER_MISMATCH, 'Mcp-Name header mismatch.', :bad_request)
          end
          return error(id, -32_602, 'Unexpected tool parameters.', :bad_request) unless (params.keys - %w[_meta name arguments]).empty?

          call_tool(id, params, modern: true)
        else
          error(id, -32_601, 'Method not found.', :not_found)
        end
      end

      def legacy_dispatch(id)
        case @message['method']
        when 'initialize' then initialize_result(id)
        when 'ping' then success(id, {})
        when 'tools/list'
          return error(id, -32_602, 'Unexpected tools/list parameters.') unless @message.fetch('params', {}).empty?

          success(id, { tools: [TOOL] })
        when 'tools/call' then call_tool(id, @message.fetch('params', {}), modern: false)
        else error(id, -32_601, 'Method not found.')
        end
      end

      def initialize_result(id)
        success(id, {
          protocolVersion: LEGACY_VERSION, capabilities: { tools: {} },
          serverInfo: { name: 'avalia-solar-mcp-private', version: '0.1.0' }
        })
      end

      def call_tool(id, params, modern:)
        name = params['name']
        return error(id, -32_602, 'Tool name is required.', :bad_request) unless name.is_a?(String)

        arguments = params.fetch('arguments', {})
        return error(id, -32_602, 'Tool arguments must be an object.', :bad_request) unless arguments.is_a?(Hash)

        data = Executor.call(
          name: name, user: @user, arguments: arguments,
          auth_context: @auth_context, remote_ip: @remote_ip
        )
        result = { content: [{ type: 'text', text: JSON.generate(data) }],
                   structuredContent: data, isError: false }
        modern ? complete(id, result) : success(id, result)
      end

      def valid_name_header?(raw_header, expected)
        return false if raw_header.empty? || raw_header.bytesize > MAX_HEADER_LENGTH

        decoded = if raw_header.start_with?('=?base64?') && raw_header.end_with?('?=')
                    Base64.strict_decode64(raw_header[9...-2]).force_encoding(Encoding::UTF_8)
                  else
                    return false unless raw_header.ascii_only? && raw_header.match?(/\A[\x20-\x7e]+\z/)

                    raw_header
                  end
        decoded.valid_encoding? && decoded == expected
      rescue ArgumentError
        false
      end

      def complete(id, result)
        success(id, { resultType: 'complete' }.merge(result))
      end

      def success(id, result)
        { status: :ok, body: { jsonrpc: '2.0', id: id, result: result } }
      end

      def error(id, code, message, status = :ok, retry_after: nil)
        response = { status: status, body: { jsonrpc: '2.0', id: id, error: { code: code, message: message } } }
        response[:retry_after] = retry_after if retry_after
        response
      end
    end
  end
end
