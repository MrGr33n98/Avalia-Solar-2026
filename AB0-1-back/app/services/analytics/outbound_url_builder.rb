# frozen_string_literal: true

require 'uri'

module Analytics
  class OutboundUrlBuilder
    ALLOWED_SCHEMES = %w[http https].freeze

    def self.call(**args)
      new(**args).call
    end

    # Campos espelham contrato público de tracking; manter detecção estrita de typo.
    # rubocop:disable Metrics/ParameterLists
    def initialize(destination:, company_id:, surface:, placement:, sponsored: false,
                   campaign: nil, content: nil, click_id: nil)
      @destination = destination
      @company_id = company_id
      @surface = surface
      @placement = placement
      @sponsored = sponsored
      @campaign = campaign
      @content = content
      @click_id = click_id
    end
    # rubocop:enable Metrics/ParameterLists

    def call
      uri = URI.parse(@destination.to_s)
      validate_destination!(uri)
      params = Rack::Utils.parse_nested_query(uri.query.to_s).transform_keys(&:to_s)
      controlled_params = Analytics::TrackingTaxonomy.outbound_params(
        surface: @surface,
        placement: @placement,
        sponsored: @sponsored,
        campaign: @campaign,
        content: @content,
        click_id: @click_id
      ).transform_keys(&:to_s)
      params.merge!(controlled_params)
      params['company_id'] = company_id_param
      uri.query = URI.encode_www_form(params)
      uri.to_s
    rescue URI::InvalidURIError
      raise ArgumentError, 'destination inválido'
    end

    private

    def validate_destination!(uri)
      return if uri.host.present? && uri.userinfo.blank? && ALLOWED_SCHEMES.include?(uri.scheme.to_s.downcase)

      raise ArgumentError, 'destination deve usar URL http(s) válida'
    end

    def company_id_param
      id = Integer(@company_id.to_s, 10)
      raise ArgumentError, 'company_id inválido' unless id.positive?

      id.to_s
    rescue ArgumentError, TypeError
      raise ArgumentError, 'company_id inválido'
    end
  end
end
