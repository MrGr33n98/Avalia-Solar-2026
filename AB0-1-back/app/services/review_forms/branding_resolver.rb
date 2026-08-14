module ReviewForms
  class BrandingResolver
    ALLOWED_ACCENTS = {
      'blue_prime' => '#155EEF',
      'navy' => '#0A1F44',
      'teal' => '#0F766E',
      'emerald' => '#047857',
      'slate' => '#475467'
    }.freeze

    def self.call(review_form)
      settings = review_form.normalized_settings
      branding = settings.fetch('branding', {})
      accent_key = branding['accent'] || branding['accent_color']
      accent_color = ALLOWED_ACCENTS[accent_key.to_s] || ALLOWED_ACCENTS['blue_prime']
      company = review_form.company

      {
        logo_url: branding['logo_override_url'].presence || company.logo_url,
        cover_url: branding['cover_image_url'].presence,
        accent_color: accent_color,
        company_name: company.name,
        trust_branding: { name: 'Avalia Solar', independent: true }
      }
    end
  end
end
