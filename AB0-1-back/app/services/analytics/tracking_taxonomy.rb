# frozen_string_literal: true

module Analytics
  module TrackingTaxonomy
    VERSION = 'tracking-attribution-v1'
    ORGANIC_SOURCE = 'avaliasolar'
    ADS_SOURCE = 'avaliasolar_ads'

    SURFACES = %w[
      company_profile search category ranking compare related_companies product project homepage ads
    ].freeze

    OUTBOUND_MEDIA = {
      'company_profile' => 'company_profile',
      'search' => 'search',
      'category' => 'category',
      'ranking' => 'ranking',
      'compare' => 'compare',
      'related_companies' => 'related',
      'product' => 'product',
      'project' => 'project',
      'homepage' => 'homepage',
      'ads' => 'banner'
    }.freeze

    module_function

    def inbound_params(source:, medium:, campaign: nil, content: nil, term: nil)
      compact_params(
        utm_source: normalize(source, 100),
        utm_medium: normalize(medium, 100),
        utm_campaign: normalize(campaign, 200),
        utm_content: normalize(content, 200),
        utm_term: normalize(term, 200)
      )
    end

    def outbound_params(surface:, placement:, sponsored:, campaign: nil, content: nil, click_id: nil)
      surface_key = normalize(surface, 64)
      raise ArgumentError, 'surface inválida' unless SURFACES.include?(surface_key)

      compact_params(
        utm_source: sponsored ? ADS_SOURCE : ORGANIC_SOURCE,
        utm_medium: OUTBOUND_MEDIA.fetch(surface_key),
        utm_campaign: normalize(campaign, 200),
        utm_content: normalize(content.presence || placement, 200),
        click_id: normalize(click_id, 128)
      )
    end

    def normalize(value, limit)
      normalized = value.to_s.strip.downcase.gsub(/\s+/, '_').gsub(/[^a-z0-9_.-]/, '')
      normalized[0, limit]
    end

    def compact_params(params)
      params.reject { |_key, value| value.blank? }
    end
  end
end
