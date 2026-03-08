# frozen_string_literal: true

# app/workers/analytics_tracking_job.rb
# Processes analytics events asynchronously and updates company_daily_stats

class AnalyticsTrackingJob
  include Sidekiq::Worker

  # Configure Sidekiq options
  sidekiq_options queue: :analytics, retry: 3

  # Process analytics event
  def perform(event_name, properties, metadata)
    company_id = properties['company_id']
    return unless company_id

    date = Date.current

    # Update company_daily_stats based on event type
    case event_name
    when 'Company Profile Viewed'
      increment_stat(company_id, date, :profile_views)
      
    when 'CTA Clicked'
      increment_stat(company_id, date, :cta_clicks)
      
    when 'WhatsApp CTA Clicked'
      increment_stat(company_id, date, :cta_clicks)
      increment_stat(company_id, date, :whatsapp_clicks)
      
    when 'Email CTA Clicked'
      increment_stat(company_id, date, :cta_clicks)
      increment_stat(company_id, date, :email_clicks)
      
    when 'Phone CTA Clicked'
      increment_stat(company_id, date, :cta_clicks)
      increment_stat(company_id, date, :phone_clicks)
      
    when 'Website CTA Clicked'
      increment_stat(company_id, date, :cta_clicks)
      increment_stat(company_id, date, :website_clicks)
      
    when 'Quote Request CTA Clicked', 'Lead Form Submitted'
      increment_stat(company_id, date, :leads)
    end

    # Store UTM attribution data (optional)
    store_utm_attribution(company_id, properties, metadata) if has_utm_params?(properties)

    # Forward to external analytics platforms
    forward_to_mixpanel(event_name, properties, metadata) if ENV['MIXPANEL_TOKEN'].present?
    forward_to_ga4(event_name, properties, metadata) if ENV['GA4_MEASUREMENT_ID'].present?

    Rails.logger.info(
      "[AnalyticsTrackingJob] Processed: event=#{event_name} " \
      "company_id=#{company_id} date=#{date}"
    )
  rescue StandardError => e
    Rails.logger.error(
      "[AnalyticsTrackingJob] Error processing event: " \
      "event=#{event_name} company_id=#{company_id} " \
      "error=#{e.class}: #{e.message}"
    )
    raise # Let Sidekiq retry
  end

  private

  # Increment a metric in company_daily_stats atomically
  def increment_stat(company_id, date, metric)
    stat = CompanyDailyStat.find_or_initialize_by(
      company_id: company_id,
      date: date
    )
    
    # Use increment! to update atomically (race-condition safe)
    stat.increment!(metric, 1)
  rescue ActiveRecord::RecordNotFound
    # Race condition: record was deleted between find_or_initialize and increment
    # Retry once
    retry_count ||= 0
    if retry_count < 1
      retry_count += 1
      retry
    else
      Rails.logger.error(
        "[AnalyticsTrackingJob] Failed to increment stat after retry: " \
        "company_id=#{company_id} date=#{date} metric=#{metric}"
      )
    end
  end

  # Check if properties contain UTM parameters
  def has_utm_params?(properties)
    %w[utm_source utm_medium utm_campaign].any? { |key| properties[key].present? }
  end

  # Store UTM attribution data for advanced analytics
  def store_utm_attribution(company_id, properties, metadata)
    return unless properties['utm_source'].present?

    attribution = CompanyUtmAttribution.find_or_initialize_by(
      company_id: company_id,
      utm_source: properties['utm_source'],
      utm_medium: properties['utm_medium'],
      utm_campaign: properties['utm_campaign']
    )

    attribution.utm_content = properties['utm_content'] if properties['utm_content'].present?
    attribution.utm_term = properties['utm_term'] if properties['utm_term'].present?
    attribution.first_seen_at ||= Date.current
    attribution.last_seen_at = Date.current

    # Increment visit if it's a profile view
    if ['Company Profile Viewed', 'profile_view'].include?(properties['event'])
      attribution.increment_visit!
    end

    # Increment CTA clicks
    if properties['cta_type'].present?
      attribution.increment_cta_click!(properties['cta_type'])
    end

    # Increment leads
    if ['Lead Form Submitted', 'Quote Request CTA Clicked'].include?(properties['event'])
      attribution.increment_lead!
    end

    attribution.save!
  rescue StandardError => e
    Rails.logger.error(
      "[AnalyticsTrackingJob] Failed to store UTM attribution: " \
      "company_id=#{company_id} error=#{e.message}"
    )
    # Don't raise - UTM tracking failures shouldn't fail the job
  end

  # Forward event to Mixpanel
  def forward_to_mixpanel(event_name, properties, metadata)
    MixpanelService.track(event_name, properties.merge(metadata))
  rescue StandardError => e
    Rails.logger.warn(
      "[AnalyticsTrackingJob] Failed to forward to Mixpanel: #{e.message}"
    )
    # Don't raise - external service failures shouldn't fail the job
  end

  # Forward event to GA4 via Measurement Protocol
  def forward_to_ga4(event_name, properties, metadata)
    Ga4Service.track(event_name, properties.merge(metadata))
  rescue StandardError => e
    Rails.logger.warn(
      "[AnalyticsTrackingJob] Failed to forward to GA4: #{e.message}"
    )
    # Don't raise - external service failures shouldn't fail the job
  end
end
