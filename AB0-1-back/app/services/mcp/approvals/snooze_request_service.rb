# frozen_string_literal: true

module Mcp
  module Approvals
    class SnoozeRequestService < BaseService
      def call
        uuid = arguments[:request_uuid].presence || arguments[:approval_request_id].presence
        until_time = arguments[:until].presence || arguments[:snoozed_until].presence
        reason = arguments[:reason].presence

        raise Mcp::Error.new(code: 'missing_param', message: 'request_uuid é obrigatório.', status: :bad_request) if uuid.blank?
        raise Mcp::Error.new(code: 'missing_time', message: 'until é obrigatório.', status: :bad_request) if until_time.blank?

        approval = McpApprovalRequest.find_by(request_uuid: uuid)
        raise Mcp::Error.new(code: 'not_found', message: 'Solicitação de aprovação não encontrada.', status: :not_found) unless approval

        approval.snooze!(user: user, until_time: until_time, reason: reason)

        {
          ok: true,
          status: approval.status,
          snoozed_until: approval.snoozed_until.iso8601,
          approval: approval.safe_details_for_viewer
        }
      end
    end
  end
end
