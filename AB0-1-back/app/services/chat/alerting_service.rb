# frozen_string_literal: true

module Chat
  class AlertingService
    EVENTS = %w[
      llm_error sse_failure ttft_degradation lead_capture_error webhook_enqueue_error
      action_cable_reconnect token_verification_failure rate_limit_spike
    ].freeze

    def self.alert(event:, properties: {})
      return unless EVENTS.include?(event.to_s)
      Rails.logger.warn("[Chat::Alert] event=#{event} properties=#{properties.slice(:session_id, :company_id, :code, :duration_ms)}")
      Chat::PosthogTrackingService.track(event: "chat_alert_#{event}", properties: properties)
    rescue StandardError => e
      Rails.logger.warn("[Chat::Alert] failed event=#{event} error=#{e.class}")
    end
  end
end
