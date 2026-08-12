# frozen_string_literal: true

module Chat
  class CanonicalAnalyticsService
    EVENTS = %w[ai_widget_seen ai_widget_opened ai_session_started ai_first_message ai_engaged_session ai_recommendation_shown ai_company_clicked ai_quote_intent ai_consent_started ai_lead_captured ai_lead_assigned ai_lead_delivered ai_human_takeover].freeze
    LEGACY_MAP = { 'chat_session_started' => 'ai_session_started', 'chat_company_recommendation_shown' => 'ai_recommendation_shown', 'chat_lead_created' => 'ai_lead_captured', 'chat_lead_submitted' => 'ai_lead_captured' }.freeze

    def self.track(event:, properties: {}, distinct_id: nil)
      canonical = LEGACY_MAP.fetch(event.to_s, event.to_s)
      return unless EVENTS.include?(canonical)
      Chat::PosthogTrackingService.track(event: canonical, properties: properties.merge(funnel_event: canonical), distinct_id: distinct_id)
    end
  end
end
