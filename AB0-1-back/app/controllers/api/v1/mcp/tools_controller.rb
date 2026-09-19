# frozen_string_literal: true

module Api
  module V1
    module Mcp
      class ToolsController < Api::V1::BaseController
        TOOL_REGISTRY = {
          'search_companies' => { service: ::Mcp::SearchCompaniesService, access: :public },
          'search_products' => { service: ::Mcp::SearchProductsService, access: :public },
          'get_company_profile' => { service: ::Mcp::CompanyProfileService, access: :public },
          'compare_companies' => { service: ::Mcp::CompareCompaniesService, access: :public },
          'get_reviews_summary' => { service: ::Mcp::ReviewsSummaryService, access: :public },
          'create_review_request' => { service: ::Mcp::ReviewRequestService, access: :company },
          'get_company_dashboard_metrics' => { service: ::Mcp::CompanyDashboardMetricsService, access: :company },
          'get_leads_summary' => { service: ::Mcp::LeadsSummaryService, access: :company },
          'recommend_next_actions' => { service: ::Mcp::NextActionsService, access: :company },
          'get_market_snapshot' => { service: ::Mcp::MarketSnapshotService, access: :admin },
          'diagnose_performance' => { service: ::Mcp::Observability::DiagnosePerformanceService, access: :admin },
          'get_system_health' => { service: ::Mcp::Observability::SystemHealthToolService, access: :admin },
          'get_outbox_health' => { service: ::Mcp::Observability::OutboxHealthToolService, access: :admin },
          'get_postgres_health' => { service: ::Mcp::Observability::PostgresHealthToolService, access: :admin },
          'get_redis_health' => { service: ::Mcp::Observability::RedisHealthToolService, access: :admin },
          'get_sidekiq_health' => { service: ::Mcp::Observability::SidekiqHealthToolService, access: :admin },
          'send_outbound_campaign' => { service: ::Mcp::OutboundCampaignService, access: :admin },
          'bulk_lead_export' => { service: ::Mcp::BulkLeadExportService, access: :company },
          'approval_list' => { service: ::Mcp::Approvals::ListApprovalsService, access: :admin },
          'approval_get' => { service: ::Mcp::Approvals::GetApprovalService, access: :admin },
          'approval_approve' => { service: ::Mcp::Approvals::ApproveRequestService, access: :admin },
          'approval_reject' => { service: ::Mcp::Approvals::RejectRequestService, access: :admin },
          'approval_snooze' => { service: ::Mcp::Approvals::SnoozeRequestService, access: :admin },
          'approval_execute' => { service: ::Mcp::Approvals::ExecuteApprovedToolService, access: :admin }
        }.merge(::Mcp::RevenueToolRegistry.entries).freeze

        RATE_LIMIT = 60
        RATE_WINDOW = 1.minute

        def create
          started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          tool_name = params[:tool_name].to_s
          execution_id = SecureRandom.uuid
          trace_id = request.headers['X-Trace-Id'] || request.headers['Traceparent'] || request.request_id

          # 1. Bloqueio prévio de ferramentas proibidas por governança (Fail-Closed)
          if ::Mcp::RiskClassifier.prohibited?(tool_name)
            log_structured_event(
              tool_name: tool_name,
              started_at: started_at,
              decision: 'DENY',
              reason: 'prohibited_tool',
              execution_id: execution_id,
              trace_id: trace_id
            )
            return render_tool_error(
              tool_name,
              'prohibited_tool',
              "A ferramenta '#{tool_name}' é estritamente proibida pelas políticas de governança do sistema.",
              :forbidden
            )
          end

          definition = TOOL_REGISTRY[tool_name]
          unless definition
            log_structured_event(
              tool_name: tool_name,
              started_at: started_at,
              decision: 'DENY',
              reason: 'unknown_tool',
              execution_id: execution_id,
              trace_id: trace_id
            )
            return render_tool_error(tool_name, 'unknown_tool', 'Tool não suportada.', :not_found)
          end

          enforce_rate_limit!(tool_name)
          authorize_access!(definition[:access])
          arguments = extract_arguments

          # 2. Governança Canônica e Autorização de Agente (Scopes, Allowed Tools, Risk Tiers, Tenant, HITL, Anti-Spoofing)
          auth_result = ::Mcp::AgentAuthorizationService.authorize!(
            tool_name: tool_name,
            arguments: arguments,
            user: current_user,
            headers: request.headers,
            params: params
          )

          service_arguments = arguments.merge(_agent_id: auth_result[:agent].agent_id)
          data = definition[:service].new(arguments: service_arguments, user: current_user, tool_name: tool_name).call
          execution_ms = elapsed_ms(started_at)

          log_structured_event(
            tool_name: tool_name,
            started_at: started_at,
            decision: 'ALLOW',
            arguments: arguments,
            auth_result: auth_result,
            execution_id: execution_id,
            trace_id: trace_id
          )

          render json: {
            ok: true,
            tool: tool_name,
            data: data,
            meta: {
              request_id: request.request_id,
              trace_id: trace_id,
              execution_id: execution_id,
              execution_ms: execution_ms,
              agent_id: auth_result[:agent]&.agent_id,
              risk_tier: auth_result[:risk_tier],
              tenant_id: auth_result[:tenant_id]
            }
          }
        rescue ::Mcp::Error => e
          execution_ms = elapsed_ms(started_at)
          decision = e.status == :accepted ? 'PENDING' : 'DENY'
          log_structured_event(
            tool_name: params[:tool_name],
            started_at: started_at,
            decision: decision,
            reason: e.code,
            details: e.details,
            arguments: extract_safe_argument_keys,
            execution_id: execution_id,
            trace_id: trace_id
          )
          render_tool_error(params[:tool_name], e.code, e.message, e.status, e.details, execution_ms)
        rescue ActionController::ParameterMissing => e
          render_tool_error(params[:tool_name], 'invalid_params', e.message, :bad_request)
        rescue StandardError => e
          Rails.logger.error("[MCP] tool=#{params[:tool_name]} request_id=#{request.request_id} error=#{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
          render_tool_error(params[:tool_name], 'internal_error', "#{e.class}: #{e.message}", :internal_server_error, { backtrace: e.backtrace.first(5) })
        end

        private

        def current_user
          return @mcp_current_user if defined?(@mcp_current_user)

          @mcp_current_user = super || authenticated_sales_api_key&.user
        end

        def authenticated_sales_api_key
          return @authenticated_sales_api_key if defined?(@authenticated_sales_api_key)

          token = request.headers['Authorization'].to_s.sub(/\ABearer\s+/i, '').strip
          @authenticated_sales_api_key = token.present? ? ::Sales::ApiKey.authenticate(token) : nil
          @authenticated_sales_api_key&.touch(:last_used_at)
          @authenticated_sales_api_key
        end

        def extract_arguments
          value = params[:arguments] || params[:input] || {}
          unless value.respond_to?(:permit) || value.is_a?(Hash)
            raise ::Mcp::Error.new(code: 'invalid_params', message: 'Os argumentos devem ser um objeto JSON.', status: :bad_request)
          end

          value.respond_to?(:permit) ? value.permit!.to_h : value.to_h
        end

        def extract_safe_argument_keys
          args = params[:arguments] || params[:input] || {}
          args.respond_to?(:keys) ? args.keys.map(&:to_s).sort : []
        rescue StandardError
          []
        end

        def authorize_access!(access)
          return if access == :public
          raise ::Mcp::Error.new(code: 'authentication_required', message: 'Autenticação obrigatória.', status: :unauthorized) unless current_user
          return if current_user.admin?
          return if access == :company && current_user.company_user? && current_user.active_company_members.exists?

          raise ::Mcp::Error.new(code: 'forbidden', message: 'Você não tem permissão para executar esta tool.', status: :forbidden)
        end

        def enforce_rate_limit!(tool_name)
          identity = current_user ? "user:#{current_user.id}" : "ip:#{request.remote_ip}"
          bucket = Time.current.to_i / RATE_WINDOW.to_i
          key = "mcp:rate:#{identity}:#{tool_name}:#{bucket}"
          count = Rails.cache.increment(key, 1, expires_in: RATE_WINDOW + 5.seconds)
          return if count.to_i <= RATE_LIMIT

          raise ::Mcp::Error.new(code: 'rate_limited', message: 'Limite de requisições excedido. Tente novamente em instantes.', status: :too_many_requests)
        end

        def render_tool_error(tool, code, message, status, details = nil, execution_ms = nil)
          error = { code: code, message: message }
          error[:details] = details if details.present?
          payload = { ok: false, tool: tool.to_s, error: error }
          payload[:meta] = { request_id: request.request_id, execution_ms: execution_ms } if execution_ms
          render json: payload, status: status
        end

        def elapsed_ms(started_at)
          ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round
        end

        def log_structured_event(tool_name:, started_at:, decision:, reason: nil, details: nil, arguments: nil, auth_result: nil, execution_id: nil, trace_id: nil)
          agent_id = auth_result ? auth_result[:agent]&.agent_id : (request.headers['X-Agent-Id'].presence || 'unknown')
          risk_tier = auth_result ? auth_result[:risk_tier] : nil
          tenant_id = auth_result ? auth_result[:tenant_id] : (current_user&.current_company&.id)
          duration_ms = elapsed_ms(started_at)

          # Argument keys sanitized (nunca logar valores sensíveis/senhas)
          arg_keys = if arguments.respond_to?(:keys)
                       arguments.keys.map(&:to_s).sort
                     elsif arguments.is_a?(Array)
                       arguments
                     else
                       []
                     end

          log_payload = {
            event: 'mcp_governance_execution',
            request_id: request.request_id,
            trace_id: trace_id,
            execution_id: execution_id,
            agent_id: agent_id,
            user_id: current_user&.id,
            tenant_id: tenant_id,
            tool_name: tool_name.to_s,
            risk_tier: risk_tier,
            decision: decision,
            reason: reason,
            duration_ms: duration_ms,
            argument_keys: arg_keys,
            approval_request_id: details.is_a?(Hash) ? details[:approval_request_id] : nil
          }.compact

          Rails.logger.info("[MCP_AUDIT] #{log_payload.to_json}")
        end
      end
    end
  end
end
