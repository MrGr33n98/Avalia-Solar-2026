# frozen_string_literal: true

class AnalyticsDailyAggregationJob < ApplicationJob
  queue_as :default
  PROFILE_VIEW_EVENTS = ['profile_view', 'Company Profile Viewed', 'company_profile_viewed'].freeze
  CTA_CLICK_EVENTS = ['cta_click', 'CTA Clicked', 'cta_clicked', 'company_cta_clicked', 'company_cta_quote'].freeze
  WHATSAPP_CLICK_EVENTS = ['whatsapp_click', 'WhatsApp CTA Clicked', 'company_cta_whatsapp'].freeze
  EMAIL_CLICK_EVENTS = ['Email CTA Clicked', 'email_click', 'company_cta_email'].freeze
  PHONE_CLICK_EVENTS = ['Phone CTA Clicked', 'phone_click', 'company_cta_phone'].freeze
  WEBSITE_CLICK_EVENTS = ['Website CTA Clicked', 'website_click', 'company_cta_website'].freeze
  LEAD_EVENTS = ['lead_created', 'Lead Form Submitted', 'Quote Request CTA Clicked'].freeze

  def perform(day: Date.yesterday)
    range = day.beginning_of_day..day.end_of_day
    AnalyticsEvent.where(tracked_at: range).group(:company_id, :event_type).count.each do |(company_id, event_type), count|
      next unless company_id

      stat = CompanyDailyStat.find_or_initialize_by(company_id: company_id, day: day)
      
      increment_daily_stat(stat, event_type, count)
      stat.save!
    end

    aggregate_cta_type_breakdown(range, day)
  end

  private

  def increment_daily_stat(stat, event_type, count)
    case event_type
    when *PROFILE_VIEW_EVENTS
      stat.profile_views = stat.profile_views.to_i + count
    when *CTA_CLICK_EVENTS
      stat.cta_clicks = stat.cta_clicks.to_i + count
    when *WHATSAPP_CLICK_EVENTS
      stat.whatsapp_clicks = stat.whatsapp_clicks.to_i + count
    when *EMAIL_CLICK_EVENTS
      stat.email_clicks = stat.email_clicks.to_i + count if stat.respond_to?(:email_clicks)
    when *PHONE_CLICK_EVENTS
      stat.phone_clicks = stat.phone_clicks.to_i + count if stat.respond_to?(:phone_clicks)
    when *WEBSITE_CLICK_EVENTS
      stat.website_clicks = stat.website_clicks.to_i + count if stat.respond_to?(:website_clicks)
    when *LEAD_EVENTS
      stat.leads = stat.leads.to_i + count
    when 'review_created'
      stat.reviews = stat.reviews.to_i + count
    end
  end

  def aggregate_cta_type_breakdown(range, day)
    expression = metadata_cta_type_expression
    return if expression.blank?

    AnalyticsEvent
      .where(tracked_at: range, event_type: CTA_CLICK_EVENTS)
      .group(:company_id, Arel.sql(expression))
      .count
      .each do |(company_id, cta_type), count|
        next if company_id.blank? || cta_type.blank?

        stat = CompanyDailyStat.find_or_initialize_by(company_id: company_id, day: day)
        case cta_type.to_s
        when 'whatsapp'
          stat.whatsapp_clicks = stat.whatsapp_clicks.to_i + count
        when 'email'
          stat.email_clicks = stat.email_clicks.to_i + count if stat.respond_to?(:email_clicks)
        when 'phone'
          stat.phone_clicks = stat.phone_clicks.to_i + count if stat.respond_to?(:phone_clicks)
        when 'website'
          stat.website_clicks = stat.website_clicks.to_i + count if stat.respond_to?(:website_clicks)
        end
        stat.save!
      end
  end

  def metadata_cta_type_expression
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    return "metadata->>'cta_type'" if adapter.include?('postgres')
    return "json_extract(metadata, '$.cta_type')" if adapter.include?('sqlite')

    nil
  end
end
