# frozen_string_literal: true

module Mcp
  module Approvals
    class RejectRequestService < BaseService
      def call
        uuid = arguments[:request_uuid].presence || arguments[:approval_request_id].presence
        reason = arguments[:reason].presence || arguments[:rejection_reason].presence
        raise Mcp::Error.new(code: 'missing_param', message: 'request_uuid é obrigatório.', status: :bad_request) if uuid.blank?

        approval = McpApprovalRequest.find_by(request_uuid: uuid)
        raise Mcp::Error.new(code: 'not_found', message: 'Solicitação de aprovação não encontrada.', status: :not_found) unless approval

        approval.reject!(user: user, reason: reason)

        {
          ok: true,
          status: approval.status,
          rejection_reason: approval.rejection_reason,
          approval: approval.safe_details_for_viewer
        }
      end
    end
  end
end
