module Analytics
  class BannerAttributionService
    def self.call(lead)
      return unless lead.utm_source == 'avaliasolar_ads'
      return if lead.utm_campaign.blank?

      match = lead.utm_campaign.match(/banner_(\d+)/)
      return unless match

      banner_id = match[1].to_i
      return if banner_id <= 0

      attribution_id = "banner:#{banner_id}:lead:#{lead.id}"
      touch = {
        'source' => lead.utm_source,
        'medium' => lead.utm_medium,
        'campaign' => lead.utm_campaign,
        'content' => lead.utm_content,
        'term' => lead.utm_term,
        'landing_path' => lead.landing_path,
        'occurred_at' => lead.created_at&.iso8601
      }.compact

      attribution = (lead.attribution_json || {}).deep_stringify_keys
      attribution['attribution_id'] ||= attribution_id
      attribution['first_touch'] ||= touch
      attribution['last_touch'] = touch
      lead.update_column(:attribution_json, attribution) if lead.has_attribute?(:attribution_json)

      BannerEvent.create_or_find_by!(event_key: Digest::SHA256.hexdigest(attribution_id)) do |event|
        event.banner_id = banner_id
        event.company_id = lead.company_id
        event.event_type = 'lead'
        event.tracked_at = lead.created_at
        event.utm_source = lead.utm_source
        event.utm_medium = lead.utm_medium
        event.utm_campaign = lead.utm_campaign
        event.utm_term = lead.utm_term
        event.utm_content = lead.utm_content
        event.metadata_json = {
          'lead_id' => lead.id,
          'status' => lead.wizard_status,
          'attribution_id' => attribution_id
        }
        event.placement = attribution.dig('last_touch', 'placement') if event.respond_to?(:placement=)
      end
      Banners::Metrics.attribution(status: 'attributed')
    rescue StandardError => e
      Banners::Metrics.attribution(status: 'error')
      report_attribution_error(e)
      Rails.logger.warn("[BannerAttributionService] Failed to create lead event: #{e.message}")
    end

    def self.report_attribution_error(error)
      return unless defined?(Sentry)

      Sentry.capture_exception(error, tags: { component: 'banner_lead_attribution' })
    rescue StandardError => reporting_error
      Rails.logger.warn("[BannerAttributionService] Sentry reporting failed: #{reporting_error.message}")
    end
  end
end
