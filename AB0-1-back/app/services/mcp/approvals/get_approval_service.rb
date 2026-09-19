# frozen_string_literal: true

module Mcp
  module Approvals
    class GetApprovalService < BaseService
      def call
        uuid = arguments[:request_uuid].presence || arguments[:approval_request_id].presence
        raise Mcp::Error.new(code: 'missing_param', message: 'request_uuid é obrigatório.', status: :bad_request) if uuid.blank?

        approval = McpApprovalRequest.find_by(request_uuid: uuid)
        raise Mcp::Error.new(code: 'not_found', message: 'Solicitação de aprovação não encontrada.', status: :not_found) unless approval

        {
          approval: approval.safe_details_for_viewer,
          policy: {
            who_can_approve: ::Mcp::ApprovalPolicyService.who_can_approve(approval),
            risk_policy: ::Mcp::ApprovalPolicyService.risk_policy(risk_tier: approval.risk_tier),
            execution_policy: ::Mcp::ApprovalPolicyService.execution_policy(tool_name: approval.tool_name)
          }
        }
      end
    end
  end
end
