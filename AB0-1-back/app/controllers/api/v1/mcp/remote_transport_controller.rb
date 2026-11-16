# frozen_string_literal: true

# MCP Streamable HTTP transport PREVIEW (2025-11-25 handshake generation).
# Isolated from the legacy /api/v1/mcp/tools/:tool_name dispatcher.
#
# Fail closed unless BOTH environment switches are configured and the caller
# presents an exact preview key. This is not OAuth and must not be published as
# a customer-facing integration. tools/call is deliberately non-executable.
module Api
  module V1
    module Mcp
      class RemoteTransportController < ActionController::API
        PROTOCOL_VERSION = '2025-11-25'
        MAX_BODY_BYTES = 32_768

        before_action :deny_unconfigured_preview!
        before_action :validate_origin!
        before_action :require_preview_key!

        def create
          response.headers['Cache-Control'] = 'no-store'
          unless request.media_type == 'application/json'
            return rpc_error(nil, -32600, 'Content-Type must be application/json.', :unsupported_media_type)
          end

          accepted = request.headers['Accept'].to_s
          unless accepted.include?('application/json') && accepted.include?('text/event-stream')
            return rpc_error(nil, -32600, 'Accept must include application/json and text/event-stream.', :not_acceptable)
          end

          if request.content_length.to_i > MAX_BODY_BYTES
            return rpc_error(nil, -32600, 'Request exceeds maximum size.', :payload_too_large)
          end

          raw = request.body.read(MAX_BODY_BYTES + 1)
          return rpc_error(nil, -32600, 'Request exceeds maximum size.', :payload_too_large) if raw.bytesize > MAX_BODY_BYTES

          message = JSON.parse(raw)
          return rpc_error(nil, -32600, 'Invalid JSON-RPC request.', :bad_request) unless message.is_a?(Hash)
          return rpc_error(nil, -32600, 'Invalid JSON-RPC version.', :bad_request) unless message['jsonrpc'] == '2.0'
          return rpc_error(nil, -32600, 'Invalid JSON-RPC method.', :bad_request) unless message['method'].is_a?(String)

          id = message['id']
          has_id = message.key?('id')
          if has_id && !(id.is_a?(String) || id.is_a?(Integer))
            return rpc_error(nil, -32600, 'Invalid JSON-RPC request identifier.', :bad_request)
          end

          params = message['params'] || {}
          return rpc_error(id, -32602, 'Parameters must be an object.', :bad_request) unless params.is_a?(Hash)

          if !has_id
            return head(:accepted) if message['method'] == 'notifications/initialized'

            return rpc_error(nil, -32600, 'Unsupported notification.', :bad_request)
          end

          version_header = request.headers['MCP-Protocol-Version'].to_s
          if version_header.present? && version_header != PROTOCOL_VERSION
            return rpc_error(id, -32602, 'Unsupported MCP protocol version.', :bad_request)
          end
          if message['method'] != 'initialize' && version_header != PROTOCOL_VERSION
            return rpc_error(id, -32602, 'MCP-Protocol-Version header required.', :bad_request)
          end

          case message['method']
          when 'initialize'
            initialize_result(id, params)
          when 'ping'
            rpc_result(id, {})
          when 'tools/list'
            return rpc_error(id, -32602, 'Unsupported tools/list parameters.', :bad_request) if params.keys.any? { |key| key != 'cursor' }
            return rpc_error(id, -32602, 'Unknown tools/list cursor.', :bad_request) if params['cursor'].present?

            rpc_result(id, { tools: ::Mcp::PublicToolRegistry.list })
          when 'tools/call'
            # Transport-only phase: never invoke even an R0 tool before the
            # external resource authorization and domain adapters are reviewed.
            rpc_error(id, -32001, 'Tool execution is unavailable in transport preview.')
          else
            rpc_error(id, -32601, 'Method not found.')
          end
        rescue JSON::ParserError
          rpc_error(nil, -32700, 'Parse error.', :bad_request)
        rescue StandardError => e
          Rails.logger.error("[MCP Remote Preview] request_id=#{request.request_id} error=#{e.class}")
          rpc_error(nil, -32603, 'Internal error.', :internal_server_error)
        end

        # Stateless JSON-only implementation: GET SSE/DELETE sessions are not
        # supported; 405 is explicitly allowed in the 2025-11-25 transport.
        def unsupported
          response.headers['Allow'] = 'POST'
          head :method_not_allowed
        end

        private

        def deny_unconfigured_preview!
          return if ENV['MCP_REMOTE_TRANSPORT_ENABLED'] == 'true' &&
                    ENV['MCP_REMOTE_PREVIEW_TOKEN'].to_s.bytesize >= 32

          head :not_found
        end

        def validate_origin!
          origin = request.headers['Origin'].to_s
          return if origin.blank?

          allowed = ENV['MCP_REMOTE_ALLOWED_ORIGINS'].to_s.split(',').map(&:strip).reject(&:blank?)
          head :forbidden unless allowed.include?(origin)
        end

        def require_preview_key!
          expected = ENV['MCP_REMOTE_PREVIEW_TOKEN'].to_s
          provided = request.headers['X-MCP-Preview-Key'].to_s
          return if provided.present? && ActiveSupport::SecurityUtils.secure_compare(provided, expected)

          head :not_found
        end

        def initialize_result(id, params)
          unless params['protocolVersion'].is_a?(String) &&
                 params['capabilities'].is_a?(Hash) &&
                 params['clientInfo'].is_a?(Hash)
            return rpc_error(id, -32602, 'Invalid initialize parameters.', :bad_request)
          end

          rpc_result(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: 'avalia-solar-mcp-preview', version: '0.1.0' },
            instructions: 'Preview only. No tools can be executed until external authorization is implemented.'
          })
        end

        def rpc_result(id, result)
          render json: { jsonrpc: '2.0', id: id, result: result }, status: :ok
        end

        def rpc_error(id, code, message, status = :ok)
          render json: { jsonrpc: '2.0', id: id, error: { code: code, message: message } }, status: status
        end
      end
    end
  end
end
