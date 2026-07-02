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
          'get_market_snapshot' => { service: ::Mcp::MarketSnapshotService, access: :admin }
        }.freeze

        RATE_LIMIT = 60
        RATE_WINDOW = 1.minute

        def create
          started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          tool_name = params[:tool_name].to_s
          definition = TOOL_REGISTRY[tool_name]
          return render_tool_error(tool_name, 'unknown_tool', 'Tool não suportada.', :not_found) unless definition

          enforce_rate_limit!(tool_name)
          authorize_access!(definition[:access])
          arguments = extract_arguments
          data = definition[:service].new(arguments: arguments, user: current_user).call
          execution_ms = elapsed_ms(started_at)
          log_execution(tool_name, execution_ms, true, arguments)

          render json: {
            ok: true,
            tool: tool_name,
            data: data,
            meta: { request_id: request.request_id, execution_ms: execution_ms }
          }
        rescue ::Mcp::Error => e
          execution_ms = elapsed_ms(started_at)
          log_execution(params[:tool_name], execution_ms, false, {}, e.code)
          render_tool_error(params[:tool_name], e.code, e.message, e.status, e.details, execution_ms)
        rescue ActionController::ParameterMissing => e
          render_tool_error(params[:tool_name], 'invalid_params', e.message, :bad_request)
        rescue StandardError => e
          Rails.logger.error("[MCP] tool=#{params[:tool_name]} request_id=#{request.request_id} error=#{e.class}: #{e.message}")
          render_tool_error(params[:tool_name], 'internal_error', 'Não foi possível executar a tool.', :internal_server_error)
        end

        private

        def extract_arguments
          value = params[:arguments] || params[:input] || {}
          unless value.respond_to?(:permit) || value.is_a?(Hash)
            raise ::Mcp::Error.new(code: 'invalid_params', message: 'Os argumentos devem ser um objeto JSON.', status: :bad_request)
          end

          value.respond_to?(:permit) ? value.permit!.to_h : value.to_h
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

        def log_execution(tool_name, execution_ms, ok, arguments, error_code = nil)
          Rails.logger.info(
            "[MCP] tool=#{tool_name} ok=#{ok} execution_ms=#{execution_ms} " \
            "request_id=#{request.request_id} user_id=#{current_user&.id || 'guest'} " \
            "argument_keys=#{arguments.respond_to?(:keys) ? arguments.keys.sort.join(',') : ''} error_code=#{error_code}"
          )
        end
      end
    end
  end
end
