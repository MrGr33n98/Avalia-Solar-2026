# frozen_string_literal: true

class AnalyticsDailyAggregationJob < ApplicationJob
  queue_as :default

  def perform(day: Date.yesterday)
    range = day.beginning_of_day..day.end_of_day
    AnalyticsEvent.where(tracked_at: range).group(:company_id, :event_type).count.each do |(company_id, event_type), count|
      next unless company_id

      stat = CompanyDailyStat.find_or_initialize_by(company_id: company_id, day: day)
      
      case event_type
      when 'profile_view', 'Company Profile Viewed'
        stat.profile_views = stat.profile_views.to_i + count
      when 'cta_click', 'CTA Clicked'
        stat.cta_clicks = stat.cta_clicks.to_i + count
      when 'whatsapp_click', 'WhatsApp CTA Clicked'
        stat.whatsapp_clicks = stat.whatsapp_clicks.to_i + count
      when 'lead_created', 'Lead Form Submitted', 'Quote Request CTA Clicked'
        stat.leads = stat.leads.to_i + count
      when 'review_created'
        stat.reviews = stat.reviews.to_i + count
      end
      stat.save!
    end
  end
end
