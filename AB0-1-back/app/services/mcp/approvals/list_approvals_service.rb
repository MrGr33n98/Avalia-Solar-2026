# frozen_string_literal: true

module Mcp
  module Approvals
    class ListApprovalsService < BaseService
      def call
        scope = McpApprovalRequest.includes(:requested_by_user, :approved_by_user, :tenant).recent_first

        status = arguments[:status].presence
        risk_tier = arguments[:risk_tier].presence
        agent_id = arguments[:agent_id].presence

        scope = scope.where(status: status) if status
        scope = scope.where(risk_tier: risk_tier) if risk_tier
        scope = scope.where(agent_id: agent_id) if agent_id

        limit = [arguments[:limit].to_i, 50].max
        limit = 50 if limit > 100

        records = scope.limit(limit)

        {
          total: scope.count,
          approvals: records.map(&:safe_details_for_viewer)
        }
      end
    end
  end
end
