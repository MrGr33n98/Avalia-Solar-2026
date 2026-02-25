# frozen_string_literal: true

class AnalyticsDailyAggregationJob < ApplicationJob
  queue_as :default

  def perform(day: Date.yesterday)
    range = day.beginning_of_day..day.end_of_day
    AnalyticsEvent.where(tracked_at: range).group(:company_id,
                                                  :event_type).count.each do |(company_id, event_type), count|
      next unless company_id

      stat = CompanyDailyStat.find_or_initialize_by(company_id: company_id, day: day)
      stat.events_count = stat.events_count.to_i + count
      case event_type
      when 'quote_click' then stat.quote_clicks = stat.quote_clicks.to_i + count
      when 'whatsapp_click' then stat.whatsapp_clicks = stat.whatsapp_clicks.to_i + count
      when 'review_created' then stat.reviews_count = stat.reviews_count.to_i + count
      end
      stat.save!
    end
  end
end
