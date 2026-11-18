# frozen_string_literal: true

module Mcp
  module Private
    class Protocol
      VERSION = '2026-07-28'
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

      def initialize(message:, user:)
        @message = message
        @user = user
      end

      def response
        id = @message['id']
        return error(id, -32_600, 'Invalid JSON-RPC request.') unless valid_request?
        return error(id, -32_602, 'Parameters must be an object.') unless @message.fetch('params', {}).is_a?(Hash)

        dispatch(id)
      rescue Mcp::Error => e
        error(id, -32_003, e.message)
      rescue Executor::InputError
        error(id, -32_602, 'Invalid private tool.')
      rescue StandardError => e
        Rails.logger.error("[MCP Private] request_id=#{RequestStore.store[:request_id]} error=#{e.class}")
        error(id, -32_603, 'Internal error.')
      end

      private

      def valid_request?
        @message['jsonrpc'] == '2.0' && @message.key?('id')
      end

      def dispatch(id)
        case @message['method']
        when 'initialize' then initialize_result(id)
        when 'ping' then success(id, {})
        when 'tools/list' then success(id, { tools: [TOOL] })
        when 'tools/call' then call_tool(id, @message.fetch('params'))
        else error(id, -32_601, 'Method not found.')
        end
      end

      def initialize_result(id)
        success(id, {
                  protocolVersion: VERSION,
                  capabilities: { tools: {} },
                  serverInfo: { name: 'avalia-solar-mcp-private', version: '0.1.0' }
                })
      end

      def call_tool(id, params)
        name = params['name']
        return error(id, -32_602, 'Tool name is required.') unless name.is_a?(String)

        arguments = params.fetch('arguments', {})
        return error(id, -32_602, 'Tool arguments must be an object.') unless arguments.is_a?(Hash)

        data = Executor.call(name: name, user: @user, arguments: arguments)
        success(id, { content: [{ type: 'text', text: JSON.generate(data) }], structuredContent: data, isError: false })
      end

      def success(id, result)
        { status: :ok, body: { jsonrpc: '2.0', id: id, result: result } }
      end

      def error(id, code, message)
        { status: :ok, body: { jsonrpc: '2.0', id: id, error: { code: code, message: message } } }
      end
    end
  end
end
