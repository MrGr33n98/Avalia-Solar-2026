# frozen_string_literal: true

module BrandHero
  class PublicSnapshot
    VERSION = 1

    def self.call(company:, url_for_attachment:)
      allowed = Eligibility.allowed?(company)
      slides = allowed ? company.company_hero_slides.published.limit(Eligibility.limit(company)).to_a : []

      {
        version: VERSION,
        enabled: allowed,
        slides: slides.filter_map do |slide|
          next unless slide.ready_for_publication?

          image_url = url_for_attachment.call(slide.image)
          next if image_url.blank?

          {
            id: slide.id,
            slot: slide.slot,
            position: slide.display_position,
            image_url: image_url,
            width: slide.image_width,
            height: slide.image_height,
            alt_text: slide.alt_text.presence || "Banner da empresa #{company.name}"
          }
        end
      }
    rescue StandardError => e
      Rails.logger.error("[BrandHero] public snapshot company=#{company.id}: #{e.class}: #{e.message}")
      { version: VERSION, enabled: false, slides: [] }
    end
  end
end
