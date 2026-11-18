# frozen_string_literal: true

module Mcp
  module Private
    # Fixed-label observability for the separate private MCP surface.
    # No tenant IDs, subject, client IDs, IPs, OAuth tokens or tool arguments.
    class Telemetry
      EVENT_NAME = 'mcp.private.request'
      OPERATIONS = %w[initialize ping tools/list tools/call].freeze
      TOOLS = %w[get_my_company_overview].freeze

      class << self
        def record(operation:, tool_name:, status:, duration_ms:, request_id: nil)
          operation = OPERATIONS.include?(operation) ? operation : 'unknown'
          tool = TOOLS.include?(tool_name) ? tool_name : 'unknown'
          status = status.to_i.clamp(100, 599)
          outcome = status >= 500 ? 'error' : (status >= 400 ? 'rejected' : 'completed')
          safe_request_id = request_id.to_s.match?(/\A[a-zA-Z0-9-]{1,64}\z/) ? request_id.to_s : nil

          payload = {
            surface: 'private',
            operation: operation,
            tool: tool,
            outcome: outcome,
            http_status: status,
            duration_ms: duration_ms.to_i.clamp(0, 120_000)
          }
          payload[:request_id] = safe_request_id if safe_request_id
          ActiveSupport::Notifications.instrument(EVENT_NAME, payload)
          Rails.logger.info(payload.merge(event: EVENT_NAME).to_json)
          payload
        end
      end
    end
  end
end
