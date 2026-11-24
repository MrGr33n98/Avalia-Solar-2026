# frozen_string_literal: true

module Mcp
  # Privacy-preserving event hook for request-level MCP observability.
  # Use only finite label sets; no user subject, IP, tool arguments, token or
  # review/company text is ever included. Exporting to OTel/metrics is a
  # separate SRE configuration and release gate.
  class RemoteTelemetry
    EVENT_NAME = 'mcp.remote.request'
    OPERATIONS = %w[initialize ping server/discover tools/list tools/call resources/list resources/read].freeze
    OUTCOMES = %w[completed rejected error].freeze

    class << self
      def record(operation:, tool_name:, status:, duration_ms:, request_id: nil)
        operation = OPERATIONS.include?(operation) ? operation : 'unknown'
        tool_name = Mcp::PublicToolRegistry.names.include?(tool_name) ? tool_name : 'unknown'
        status = status.to_i.clamp(100, 599)
        outcome = status >= 500 ? 'error' : status >= 400 ? 'rejected' : 'completed'
        # Never trust an arbitrary inbound Request-ID header as an unbounded log label.
        safe_request_id = request_id.to_s.match?(/\A[a-zA-Z0-9-]{1,64}\z/) ? request_id.to_s : nil
        payload = {
          operation: operation,
          tool: tool_name,
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
