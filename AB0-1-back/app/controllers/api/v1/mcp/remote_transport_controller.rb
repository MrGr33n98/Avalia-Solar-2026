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

        before_action :start_remote_timer!, only: :create
        after_action :record_remote_telemetry!, only: :create
        before_action :deny_unconfigured_preview!
        before_action :validate_host!
        before_action :validate_origin!
        before_action :authorize_remote_request!
        before_action :enforce_remote_quota!, only: :create, if: -> { ENV['MCP_REMOTE_POLICY_ENABLED'] == 'true' }
        skip_before_action :authorize_remote_request!, only: :resource_metadata

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

          # Modern MCP transports are independent and stateless. Preserve
          # the legacy handshake preview for 2025-11-25 clients.
          if modern_request?(params)
            outcome = ::Mcp::ModernPreviewProtocol.new(
              headers: request.headers, message: message, auth_context: @mcp_auth_context
            ).response
            return head :accepted if outcome[:status] == :accepted

            return render json: outcome.fetch(:body), status: outcome.fetch(:status)
          end

          version_header = request.headers['MCP-Protocol-Version'].to_s
          if version_header.present? && version_header != PROTOCOL_VERSION
            return rpc_error(id, -32602, 'Unsupported MCP protocol version.', :bad_request)
          end
          if message['method'] != 'initialize' && version_header != PROTOCOL_VERSION
            return rpc_error(id, -32602, 'MCP-Protocol-Version header required.', :bad_request)
          end

          canary_error = authorize_canary_legacy_request!(message['method'], params, id: id)
          return canary_error if canary_error

          unless has_id
            return head(:accepted) if message['method'] == 'notifications/initialized'

            return rpc_error(nil, -32600, 'Unsupported notification.', :bad_request)
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
          when 'resources/list'
            handle_resources_list(id, params)
          when 'resources/read'
            handle_resources_read(id, params)
          when 'tools/call'
            execute_legacy_tool(id, params)
          else
            rpc_error(id, -32601, 'Method not found.')
          end
        rescue JSON::ParserError
          rpc_error(nil, -32700, 'Parse error.', :bad_request)
        rescue StandardError => e
          Rails.logger.error("[MCP Remote Preview] request_id=#{request.request_id} error=#{e.class}")
          rpc_error(nil, -32603, 'Internal error.', :internal_server_error)
        end

        # Public OAuth resource metadata is discovery-only, not a token issuer.
        # It is only exposed when the real resource-server configuration is valid.
        def resource_metadata
          return head :not_found unless oauth_mode?

          response.headers['Cache-Control'] = 'no-store'
          render json: {
            resource: ::Mcp::Oauth::ResourceAuthorization.resource,
            authorization_servers: [::Mcp::Oauth::ResourceAuthorization.issuer],
            scopes_supported: [::Mcp::Oauth::ResourceAuthorization::REQUIRED_SCOPE],
            bearer_methods_supported: ['header']
          }, status: :ok
        end

        # Stateless JSON-only implementation: GET SSE/DELETE sessions are not
        # supported; 405 is explicitly allowed in the 2025-11-25 transport.
        def unsupported
          response.headers['Allow'] = 'POST'
          head :method_not_allowed
        end

        private

        def start_remote_timer!
          @mcp_started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        end

        def record_remote_telemetry!
          return unless @mcp_started_at

          elapsed = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - @mcp_started_at) * 1000).round
          ::Mcp::RemoteTelemetry.record(
            operation: request.headers['Mcp-Method'].to_s.presence || 'unknown',
            tool_name: request.headers['Mcp-Name'].to_s,
            status: response.status, duration_ms: elapsed,
            request_id: request.request_id
          )
        rescue StandardError => e
          # Telemetry must never take down a completed request.
          Rails.logger.warn("[MCP Telemetry] failed class=#{e.class}")
        end

        def deny_unconfigured_preview!
          return head :not_found unless ENV['MCP_REMOTE_TRANSPORT_ENABLED'] == 'true'

          # Separate production approval gate: accidental preview-token
          # enablement can never activate this endpoint on the live app.
          if Rails.env.production?
            return head :not_found unless ENV['MCP_REMOTE_PRODUCTION_ENABLED'] == 'true' &&
                                          ENV['MCP_REMOTE_AUTH_MODE'] == 'oauth'
          end

          case ENV.fetch('MCP_REMOTE_AUTH_MODE', 'preview')
          when 'preview'
            return if ENV['MCP_REMOTE_PREVIEW_TOKEN'].to_s.bytesize >= 32
          when 'oauth'
            return if ::Mcp::Oauth::ResourceAuthorization.configured?
          end

          head :not_found
        end

        def oauth_mode?
          ENV['MCP_REMOTE_AUTH_MODE'] == 'oauth'
        end

        def validate_host!
          # Origin validation alone does not cover clients that omit Origin.
          # Explicit host allowlisting prevents accidental DNS-rebinding entry.
          allowed_hosts = ENV['MCP_REMOTE_ALLOWED_HOSTS'].to_s.split(',').map(&:strip).reject(&:blank?)
          head :forbidden unless allowed_hosts.include?(request.host)
        end

        def validate_origin!
          origin = request.headers['Origin'].to_s
          return if origin.blank?

          allowed = ENV['MCP_REMOTE_ALLOWED_ORIGINS'].to_s.split(',').map(&:strip).reject(&:blank?)
          head :forbidden unless allowed.include?(origin)
        end

        def authorize_remote_request!
          return authorize_oauth! if oauth_mode?

          expected = ENV['MCP_REMOTE_PREVIEW_TOKEN'].to_s
          provided = request.headers['X-MCP-Preview-Key'].to_s
          if provided.present? && ActiveSupport::SecurityUtils.secure_compare(provided, expected)
            @mcp_auth_context = { subject: 'preview', client_id: 'preview' }.freeze
            return
          end

          head :not_found
        end

        def authorize_oauth!
          @mcp_auth_context = ::Mcp::Oauth::ResourceAuthorization.new(
            authorization_header: request.headers['Authorization']
          ).verify!
        rescue ::Mcp::Oauth::ResourceAuthorization::Failure => e
          # The resource server never redirects, issues access tokens or
          # infers trust from the User-Agent, cookie, tenant headers or MCP args.
          return head :not_found if e.type == :unavailable

          challenge = %(Bearer resource_metadata="#{::Mcp::Oauth::ResourceAuthorization.metadata_url}")
          if e.type == :insufficient_scope
            response.headers['WWW-Authenticate'] = %(#{challenge}, error="insufficient_scope", scope="mcp:public:read")
            return head :forbidden
          end

          response.headers['WWW-Authenticate'] = %(#{challenge}, error="invalid_token")
          head :unauthorized
        end

        def enforce_remote_quota!
          context = @mcp_auth_context || {}
          ::Mcp::RemoteQuotaPolicy.new(
            identity: context[:subject], client_id: context[:client_id],
            remote_ip: request.remote_ip.to_s, mode: oauth_mode? ? :oauth : :preview
          ).enforce!
        rescue ::Mcp::RemoteQuotaPolicy::Failure => e
          if e.type == :rate_limited
            response.headers['Retry-After'] = e.retry_after.to_s
            return head :too_many_requests
          end

          head :service_unavailable
        end

        def authorize_canary_legacy_request!(method, params, id: nil)
          return nil unless ::Mcp::Canary::Configuration.enforced?

          ::Mcp::Canary::Guard.authorize!(
            method: method, tool_name: params['name'], auth_context: @mcp_auth_context
          )
          nil
        rescue ::Mcp::Canary::Guard::Failure => e
          status = e.type == :unavailable ? :not_found : :forbidden
          rpc_error(id, -32_001, 'MCP canary authorization denied.', status)
        end

        def execute_legacy_tool(id, params)
          tool_name = params['name']
          unless tool_name.is_a?(String) && tool_name.present?
            return rpc_error(id, -32_602, 'Tool name is required.', :bad_request)
          end

          arguments = params['arguments'].is_a?(Hash) ? params['arguments'] : {}

          unless legacy_execution_authorized?(params)
            return rpc_error(id, -32_001, 'Tool execution is unavailable in transport preview.')
          end

          begin
            data = ::Mcp::Public::Executor.call(
              name: tool_name,
              arguments: arguments,
              principal: @mcp_auth_context.is_a?(Hash) ? @mcp_auth_context[:subject] : nil
            )
            data = ::Mcp::Public::OutputValidator.validate!(name: tool_name, payload: data)
            summary = ::Mcp::Ui::TextSummaryFormatter.call(name: tool_name, payload: data)
            result_payload = {
              content: [{ type: 'text', text: summary }],
              structuredContent: data,
              isError: false
            }
            ui_meta = ::Mcp::Ui::ResourceRegistry.tool_meta(tool_name)
            result_payload[:_meta] = ui_meta if ui_meta
            rpc_result(id, result_payload)
          rescue ::Mcp::Public::Executor::NotAvailable
            rpc_error(id, -32_001, 'Tool not yet available.')
          rescue ::Mcp::Public::InputValidator::Invalid
            rpc_error(id, -32_602, 'Invalid public tool arguments.', :bad_request)
          rescue ::Mcp::Public::DirectoryService::NotFound
            rpc_error(id, -32_602, 'Public company not found.', :not_found)
          rescue ::Mcp::Public::OutputValidator::Invalid
            rpc_error(id, -32_603, 'Public tool result validation failed.', :internal_server_error)
          end
        end

        def legacy_execution_authorized?(params)
          return false if ::Mcp::Canary::Configuration.enforced? && !legacy_canary_authorized?('tools/call', params)

          ENV['MCP_PUBLIC_TOOLS_EXECUTION_ENABLED'] == 'true' &&
            ENV['MCP_REMOTE_POLICY_ENABLED'] == 'true' &&
            ENV['MCP_REMOTE_AUTH_MODE'] == 'oauth' &&
            ENV['MCP_REMOTE_OAUTH_ENABLED'] == 'true' &&
            @mcp_auth_context.is_a?(Hash) &&
            @mcp_auth_context[:subject].present? &&
            @mcp_auth_context[:client_id].present? &&
            Array(@mcp_auth_context[:scopes]).include?('mcp:public:read')
        end

        def legacy_canary_authorized?(method, params)
          ::Mcp::Canary::Guard.authorize!(
            method: method, tool_name: params['name'], auth_context: @mcp_auth_context
          )
          true
        rescue ::Mcp::Canary::Guard::Failure
          false
        end

        def modern_request?(params)
          request.headers['MCP-Protocol-Version'].to_s == ::Mcp::ModernPreviewProtocol::VERSION ||
            request.headers['Mcp-Method'].present? ||
            (params['_meta'].is_a?(Hash) && params['_meta'].key?('io.modelcontextprotocol/protocolVersion'))
        end

        def initialize_result(id, params)
          unless params['protocolVersion'].is_a?(String) &&
                 params['capabilities'].is_a?(Hash) &&
                 params['clientInfo'].is_a?(Hash)
            return rpc_error(id, -32602, 'Invalid initialize parameters.', :bad_request)
          end

          capabilities = ::Mcp::Ui::ResourceRegistry.enabled? ? { tools: {}, resources: { listChanged: false } } : { tools: {} }
          rpc_result(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: capabilities,
            serverInfo: { name: 'avalia-solar-mcp-preview', version: '0.1.0' },
            instructions: 'Preview only. No tools can be executed until external authorization is implemented.'
          })
        end

        def handle_resources_list(id, params)
          return rpc_error(id, -32601, 'Method not found.') unless ::Mcp::Ui::ResourceRegistry.enabled?
          return rpc_error(id, -32602, 'Unsupported resources/list parameters.', :bad_request) if params.keys.any? { |k| k != 'cursor' }

          rpc_result(id, { resources: ::Mcp::Ui::ResourceRegistry.list })
        end

        def handle_resources_read(id, params)
          return rpc_error(id, -32601, 'Method not found.') unless ::Mcp::Ui::ResourceRegistry.enabled?

          uri = params['uri']
          return rpc_error(id, -32602, 'Resource URI is required.', :bad_request) unless uri.is_a?(String) && uri.present?

          content = ::Mcp::Ui::ResourceRegistry.read(uri)
          return rpc_error(id, -32602, 'Resource not found.', :not_found) unless content

          rpc_result(id, { contents: [content] })
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
