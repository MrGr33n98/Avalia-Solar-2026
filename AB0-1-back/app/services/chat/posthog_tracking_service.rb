# frozen_string_literal: true

module Chat
  class PosthogTrackingService
    def self.track(event:, properties: {}, distinct_id: nil)
      return unless ENV.fetch('CHAT_POSTHOG_TRACKING_ENABLED', 'true') == 'true'

      Analytics::PostHogService.capture(
        event,
        properties.merge(source: 'chat_ia', platform: 'backend'),
        distinct_id: distinct_id || properties[:visitor_id] || 'anonymous'
      )
    rescue StandardError => e
      # PostHog NEVER breaks the chat flow
      Rails.logger.warn("[Chat::PostHog] Tracking failed for #{event}: #{e.message}")
    end
  end
end
