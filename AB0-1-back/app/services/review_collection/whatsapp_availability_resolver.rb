# frozen_string_literal: true

module ReviewCollection
  # Query: zero writes, one canonical public contract for the Review WhatsApp CTA.
  class WhatsAppAvailabilityResolver
    LABEL = 'Deixe sua avaliação pelo WhatsApp'.freeze

    def self.call(company:)
      new(company:).call
    end

    def initialize(company:)
      @company = company
    end

    def call
      return hidden unless company.voice_review_cta_enabled? && company.active_status?
      return hidden unless VoiceReviews::Config.enabled? && VoiceReviews::Config.provider == 'waha'
      return hidden if VoiceReviews::Config.whatsapp_number.blank? ||
                       VoiceReviews::Config.waha_api_key.blank? ||
                       VoiceReviews::Config.waha_webhook_hmac_secret.blank? ||
                       VoiceReviews::Config.contact_pepper.blank?

      invite = VoiceReviewInvite.where(company_id: company.id, source: 'brand_page', status: 'active')
                                .includes(:review_form).order(created_at: :desc).detect(&:active_now?)
      return hidden unless invite

      href = invite.whatsapp_url
      uri = URI.parse(href.to_s)
      return hidden unless uri.scheme == 'https' && uri.host == 'wa.me'

      { enabled: true, label: LABEL, href: href, landing_url: invite.public_url }
    rescue URI::InvalidURIError, StandardError => e
      Rails.logger.warn("[ReviewCollection] WhatsApp CTA indisponível company=#{company.id} error=#{e.class}")
      hidden
    end

    private

    attr_reader :company

    def hidden
      { enabled: false, label: LABEL, href: nil, landing_url: nil }
    end
  end
end
