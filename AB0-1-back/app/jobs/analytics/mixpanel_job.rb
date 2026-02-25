# frozen_string_literal: true

module Analytics
  class MixpanelJob < ApplicationJob
    queue_as :analytics

    def perform(distinct_id:, event_name:, properties: {})
      token = ENV.fetch('MIXPANEL_PROJECT_TOKEN', nil)
      return if token.blank?

      tracker = Mixpanel::Tracker.new(token)
      tracker.track(distinct_id, event_name, properties)
    rescue StandardError => e
      Rails.logger.error("[MixpanelJob] Error tracking event #{event_name}: #{e.message}")
    end
  end
end
