module Analytics
  class BannerAttributionService
    def self.call(lead)
      return unless lead.utm_source == 'avaliasolar_ads'
      return if lead.utm_campaign.blank?

      # Extract banner_id from 'banner_123'
      match = lead.utm_campaign.match(/banner_(\d+)/)
      return unless match

      banner_id = match[1].to_i
      return if banner_id <= 0

      begin
        BannerEvent.create!(
          banner_id: banner_id,
          company_id: lead.company_id,
          event_type: 'lead',
          tracked_at: lead.created_at,
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          utm_term: lead.utm_term,
          utm_content: lead.utm_content,
          metadata_json: {
            lead_id: lead.id,
            status: lead.wizard_status
          }
        )
      rescue StandardError => e
        Rails.logger.warn("[BannerAttributionService] Failed to create lead event: #{e.message}")
      end
    end
  end
end
