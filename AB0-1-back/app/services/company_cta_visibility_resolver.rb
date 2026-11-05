# frozen_string_literal: true

# Single server-side source of truth. Preferences never grant an entitlement.
class CompanyCtaVisibilityResolver
  def initialize(company)
    @company = company
  end

  def call
    quote_allowed = @company.quote_feature_enabled? == true
    whatsapp_allowed = @company.whatsapp_contact_button_entitled? == true

    {
      preferences: {
        quote_cta_enabled: @company.quote_cta_enabled? == true,
        whatsapp_enabled: @company.whatsapp_enabled == true
      },
      availability: {
        quote: quote_allowed,
        whatsapp: whatsapp_allowed,
        whatsapp_configured: @company.whatsapp_contact_number.present?
      },
      effective: {
        quote: quote_allowed && @company.quote_cta_enabled?,
        whatsapp: @company.whatsapp_contact_button_enabled? == true
      },
      version: @company.cta_visibility_version
    }
  end
end
