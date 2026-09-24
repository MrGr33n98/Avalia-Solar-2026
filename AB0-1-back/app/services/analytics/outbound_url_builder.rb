# frozen_string_literal: true

require 'uri'

module Analytics
  class OutboundUrlBuilder
    ALLOWED_SCHEMES = %w[http https].freeze

    def self.call(**args)
      new(**args).call
    end

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

    def call
      uri = URI.parse(@destination.to_s)
      validate_destination!(uri)
      params = Rack::Utils.parse_nested_query(uri.query.to_s)
      params.merge!(Analytics::TrackingTaxonomy.outbound_params(
        surface: @surface,
        placement: @placement,
        sponsored: @sponsored,
        campaign: @campaign,
        content: @content,
        click_id: @click_id
      ))
      params['company_id'] = @company_id.to_i.to_s if @company_id.present?
      uri.query = URI.encode_www_form(params)
      uri.to_s
    rescue URI::InvalidURIError
      raise ArgumentError, 'destination inválido'
    end

    private

    def validate_destination!(uri)
      return if uri.host.present? && ALLOWED_SCHEMES.include?(uri.scheme.to_s.downcase)

      raise ArgumentError, 'destination deve usar URL http(s) válida'
    end
  end
end
