# frozen_string_literal: true

module Recommendation
  # A recommendation is discovery. Segment, sponsored position and verification
  # never grant conversion entitlement. The company resolver is authoritative.
  class CtaResolver
    DEFAULT_PRIMARY_CTA = {
      type: 'view_profile',
      label: 'Ver perfil',
      action: 'navigate_profile'
    }.freeze

    def self.call(company)
      new(company).call
    end

    def initialize(company)
      @company = company
    end

    def call
      profile_url = "/companies/#{company.slug.presence || company.id}"
      visibility = CompanyCtaVisibilityResolver.new(company).call.fetch(:effective)
      primary =
        if visibility[:quote] == true
          { type: 'request_quote', label: 'Solicitar orçamento',
            action: 'open_quote_wizard', preferred_company_id: company.id, url: profile_url }
        elsif visibility[:whatsapp] == true && company.whatsapp_contact_url.present?
          { type: 'whatsapp', label: 'WhatsApp',
            action: 'open_whatsapp', url: company.whatsapp_contact_url }
        else
          DEFAULT_PRIMARY_CTA.merge(url: profile_url)
        end

      {
        primary: primary,
        secondary: {
          type: 'rate_company',
          label: 'Avaliar essa empresa',
          action: 'open_review_form',
          url: profile_url
        }
      }
    end

    private

    attr_reader :company
  end
end
