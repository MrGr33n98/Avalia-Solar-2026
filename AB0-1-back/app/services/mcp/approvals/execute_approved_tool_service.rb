# frozen_string_literal: true

module Mcp
  module Approvals
    class ExecuteApprovedToolService < BaseService
      def call
        uuid = arguments[:request_uuid].presence || arguments[:approval_request_id].presence
        raise Mcp::Error.new(code: 'missing_param', message: 'request_uuid é obrigatório.', status: :bad_request) if uuid.blank?

        result = ::Mcp::ApprovedToolExecutionService.execute!(
          request_uuid: uuid,
          user: user,
          execution_id: arguments[:execution_id],
          force_sync: arguments[:force_sync] == true || arguments[:force_sync] == 'true'
        )

        {
          ok: true,
          execution: result
        }
      end
    end
  end
end
