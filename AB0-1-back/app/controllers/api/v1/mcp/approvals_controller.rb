# frozen_string_literal: true

module Api
  module V1
    module Mcp
      class ApprovalsController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_control_plane_access!
        before_action :set_approval_request, only: %i[show approve reject snooze unsnooze execute events]

        # GET /api/v1/mcp/approvals
        def index
          scope = McpApprovalRequest.includes(:requested_by_user, :approved_by_user, :tenant).recent_first

          # Filtros de listagem
          scope = scope.where(status: params[:status]) if params[:status].present? && McpApprovalRequest::STATUSES.include?(params[:status])
          scope = scope.where(risk_tier: params[:risk_tier]) if params[:risk_tier].present?
          scope = scope.where(agent_id: params[:agent_id]) if params[:agent_id].present?
          scope = scope.where(tool_name: params[:tool_name]) if params[:tool_name].present?
          scope = scope.where(tenant_id: params[:tenant_id]) if params[:tenant_id].present?

          if params[:snoozed] == 'true'
            scope = scope.snoozed
          elsif params[:snoozed] == 'false'
            scope = scope.pending_unsnoozed
          end

          if params[:expiring_soon] == 'true'
            scope = scope.expiring_soon(30.minutes)
          end

          if params[:date_from].present?
            scope = scope.where('created_at >= ?', Time.zone.parse(params[:date_from])) rescue scope
          end

          if params[:date_to].present?
            scope = scope.where('created_at <= ?', Time.zone.parse(params[:date_to])) rescue scope
          end

          page = [params[:page].to_i, 1].max
          per_page = [[params[:per_page].to_i, 20].max, 100].min
          total_count = scope.count
          total_pages = (total_count.to_f / per_page).ceil

          records = scope.offset((page - 1) * per_page).limit(per_page)

          render json: {
            data: records.map(&:safe_details_for_viewer),
            meta: {
              page: page,
              per_page: per_page,
              total: total_count,
              total_pages: total_pages
            }
          }
        end

        # GET /api/v1/mcp/approvals/stats
        def stats
          now = Time.current

          total_pending = McpApprovalRequest.where(status: 'pending').where('expires_at > ?', now).count
          snoozed_count = McpApprovalRequest.where(status: 'pending').where('expires_at > ? AND snoozed_until > ?', now, now).count
          active_pending_count = total_pending - snoozed_count

          high_risk_pending = McpApprovalRequest.where(status: 'pending', risk_tier: %w[r3 r4]).where('expires_at > ?', now).count
          expiring_soon = McpApprovalRequest.where(status: 'pending').where('expires_at > ? AND expires_at <= ?', now, now + 30.minutes).count

          approved_count = McpApprovalRequest.where(status: 'approved').count
          executed_count = McpApprovalRequest.where(status: 'executed').count
          rejected_count = McpApprovalRequest.where(status: 'rejected').count
          expired_count = McpApprovalRequest.where(status: 'expired').or(
            McpApprovalRequest.where(status: 'pending').where('expires_at <= ?', now)
          ).count

          render json: {
            stats: {
              pending: total_pending,
              active_pending: active_pending_count,
              snoozed: snoozed_count,
              high_risk_pending: high_risk_pending,
              expiring_soon: expiring_soon,
              approved: approved_count,
              executed: executed_count,
              rejected: rejected_count,
              expired: expired_count
            },
            meta: {
              timestamp: now.iso8601
            }
          }
        end

        # GET /api/v1/mcp/approvals/:request_uuid
        def show
          policy_info = {
            risk_policy: ::Mcp::ApprovalPolicyService.risk_policy(risk_tier: @approval_request.risk_tier),
            execution_policy: ::Mcp::ApprovalPolicyService.execution_policy(tool_name: @approval_request.tool_name),
            who_can_approve: ::Mcp::ApprovalPolicyService.who_can_approve(@approval_request),
            user_can_approve: ::Mcp::ApprovalPolicyService.can_user_approve?(user: current_user, approval_request: @approval_request)
          }

          render json: {
            data: @approval_request.safe_details_for_viewer,
            policy: policy_info
          }
        end

        # POST /api/v1/mcp/approvals/:request_uuid/approve
        def approve
          @approval_request.approve!(user: current_user)

          render json: {
            ok: true,
            status: @approval_request.status,
            message: 'Solicitação HITL aprovada com sucesso.',
            data: @approval_request.safe_details_for_viewer
          }
        rescue ::Mcp::Error => e
          render json: { ok: false, error: { code: e.code, message: e.message } }, status: e.status
        end

        # POST /api/v1/mcp/approvals/:request_uuid/reject
        def reject
          reason = params[:reason].presence || params[:rejection_reason].presence
          @approval_request.reject!(user: current_user, reason: reason)

          render json: {
            ok: true,
            status: @approval_request.status,
            message: 'Solicitação HITL rejeitada.',
            data: @approval_request.safe_details_for_viewer
          }
        rescue ::Mcp::Error => e
          render json: { ok: false, error: { code: e.code, message: e.message } }, status: e.status
        end

        # POST /api/v1/mcp/approvals/:request_uuid/snooze
        def snooze
          until_time = params[:until] || params[:snoozed_until]
          reason = params[:reason].presence

          if until_time.blank?
            return render json: { ok: false, error: { code: 'missing_time', message: 'Parâmetro until é obrigatório.' } }, status: :bad_request
          end

          @approval_request.snooze!(user: current_user, until_time: until_time, reason: reason)

          render json: {
            ok: true,
            status: @approval_request.status,
            snoozed_until: @approval_request.snoozed_until.iso8601,
            message: 'Solicitação adiada na fila operacional.',
            data: @approval_request.safe_details_for_viewer
          }
        rescue ::Mcp::Error => e
          render json: { ok: false, error: { code: e.code, message: e.message } }, status: e.status
        end

        # POST /api/v1/mcp/approvals/:request_uuid/unsnooze
        def unsnooze
          @approval_request.unsnooze!(user: current_user)

          render json: {
            ok: true,
            status: @approval_request.status,
            message: 'Snooze removido da solicitação.',
            data: @approval_request.safe_details_for_viewer
          }
        rescue ::Mcp::Error => e
          render json: { ok: false, error: { code: e.code, message: e.message } }, status: e.status
        end

        # POST /api/v1/mcp/approvals/:request_uuid/execute
        def execute
          force_sync = params[:force_sync] == true || params[:force_sync] == 'true'
          result = ::Mcp::ApprovedToolExecutionService.execute!(
            request_uuid: @approval_request.request_uuid,
            user: current_user,
            execution_id: params[:execution_id],
            force_sync: force_sync
          )

          render json: {
            ok: true,
            execution: result,
            data: @approval_request.reload.safe_details_for_viewer
          }
        rescue ::Mcp::Error => e
          render json: { ok: false, error: { code: e.code, message: e.message, details: e.details } }, status: e.status
        rescue StandardError => e
          render json: { ok: false, error: { code: 'execution_error', message: "#{e.class}: #{e.message}" } }, status: :internal_server_error
        end

        # GET /api/v1/mcp/approvals/:request_uuid/events
        def events
          events_scope = DomainEvent.where(aggregate_type: 'McpApprovalRequest', aggregate_id: @approval_request.id.to_s)
                                    .or(DomainEvent.where("payload->>'request_uuid' = ?", @approval_request.request_uuid))
                                    .order(occurred_at: :asc)

          events_data = events_scope.map do |evt|
            {
              id: evt.id,
              event_type: evt.event_type,
              occurred_at: evt.occurred_at.iso8601,
              status: evt.status,
              payload: evt.payload.except('secret', 'raw_secret', 'token')
            }
          end

          render json: {
            request_uuid: @approval_request.request_uuid,
            events: events_data
          }
        end

        private

        def set_approval_request
          @approval_request = McpApprovalRequest.find_by(request_uuid: params[:request_uuid] || params[:id])
          unless @approval_request
            render json: { ok: false, error: { code: 'not_found', message: 'Solicitação de aprovação não encontrada.' } }, status: :not_found
          end
        end

        def require_control_plane_access!
          return if current_user.admin?
          return if current_user.respond_to?(:has_role?) && current_user.has_role?(:admin)
          return if current_user.respond_to?(:has_permission?) && current_user.has_permission?(:mcp_approvals_view)
          return if defined?(::Sales::AuthorizationService) && ::Sales::AuthorizationService.can?(user: current_user, permission: 'mcp.approvals.view')

          render json: {
            ok: false,
            error: {
              code: 'mcp_access_denied',
              message: 'Acesso restrito ao AI Approval Control Plane da equipe interna.'
            }
          }, status: :forbidden
        end
      end
    end
  end
end
