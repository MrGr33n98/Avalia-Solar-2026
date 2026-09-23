# frozen_string_literal: true

module Analytics
  module EventTaxonomy
    PROFILE_VIEW_EVENTS = %w[profile_view view Company Profile Viewed company_profile_viewed company_profile_view].freeze
    CTA_EVENTS = %w[
      cta_click click CTA\ Clicked cta_clicked company_cta_clicked
      company_cta_whatsapp company_cta_email company_cta_phone company_cta_website company_cta_quote
      whatsapp_click WhatsApp\ CTA\ Clicked email_click Email\ CTA\ Clicked phone_click Phone\ CTA\ Clicked
      website_click Website\ CTA\ Clicked
    ].freeze
    LEAD_EVENTS = %w[lead lead_created Lead\ Form\ Submitted].freeze

    ALIASES = {
      'view' => 'profile_view', 'Company Profile Viewed' => 'profile_view',
      'company_profile_viewed' => 'profile_view', 'company_profile_view' => 'profile_view',
      'click' => 'cta_click', 'CTA Clicked' => 'cta_click', 'cta_clicked' => 'cta_click',
      'company_cta_clicked' => 'cta_click', 'company_cta_whatsapp' => 'cta_click',
      'company_cta_email' => 'cta_click', 'company_cta_phone' => 'cta_click',
      'company_cta_website' => 'cta_click', 'company_cta_quote' => 'cta_click',
      'whatsapp_click' => 'cta_click', 'WhatsApp CTA Clicked' => 'cta_click',
      'email_click' => 'cta_click', 'Email CTA Clicked' => 'cta_click',
      'phone_click' => 'cta_click', 'Phone CTA Clicked' => 'cta_click',
      'website_click' => 'cta_click', 'Website CTA Clicked' => 'cta_click',
      'Quote Request CTA Clicked' => 'cta_click',
      'lead' => 'lead_created', 'Lead Form Submitted' => 'lead_created'
    }.freeze

    CTA_TYPES = {
      'company_cta_whatsapp' => 'whatsapp', 'whatsapp_click' => 'whatsapp', 'WhatsApp CTA Clicked' => 'whatsapp',
      'company_cta_email' => 'email', 'email_click' => 'email', 'Email CTA Clicked' => 'email',
      'company_cta_phone' => 'phone', 'phone_click' => 'phone', 'Phone CTA Clicked' => 'phone',
      'company_cta_website' => 'website', 'website_click' => 'website', 'Website CTA Clicked' => 'website',
      'company_cta_quote' => 'quote', 'Quote Request CTA Clicked' => 'quote'
    }.freeze

    module_function

    def canonical(raw_type)
      ALIASES.fetch(raw_type.to_s, raw_type.to_s)
    end

    def cta_type(raw_type, metadata = {})
      metadata['cta_type'].presence || CTA_TYPES[raw_type.to_s]
    end

    def aliases_for(canonical_type)
      ALIASES.select { |_, value| value == canonical_type }.keys | [canonical_type]
    end
  end
end
