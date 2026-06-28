# frozen_string_literal: true

# Background job for analytics event tracking
# Decouples analytics persistence from main business flows
class Analytics::TrackEventJob < ApplicationJob
  queue_as :analytics

  # Retry strategy specifically for analytics
  sidekiq_retry_in do |count|
    case count
    when 0 then 30.seconds
    when 1 then 2.minutes
    when 2 then 10.minutes
    when 3 then 30.minutes
    when 4 then 1.hour
    else
      :kill
    end
  end

  def perform(company_id:, event_type:, metadata: {}, user_id: nil, tracked_at: nil, event_id: nil)
    # Use existing TrackEventService - preserves all Bloco 2 behavior
    user = user_id ? User.find_by(id: user_id) : nil

    result = Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: event_type,
      metadata: metadata,
      user: user,
      tracked_at: tracked_at,
      event_id: event_id
    )

    # Log result for monitoring
    if result.ok
      Rails.logger.info("[Analytics] Event tracked async: #{event_type} for company #{company_id}")
    else
      Rails.logger.warn("[Analytics] Event tracking failed async: #{result.error}")
    end

    result
  rescue StandardError => e
    # Let ApplicationJob retry strategy handle this
    Rails.logger.error("[Analytics] TrackEventJob failed: #{e.class} - #{e.message}")
    raise e
  end
end
