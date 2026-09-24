# frozen_string_literal: true

require 'uri'

module Analytics
  class AttributionClassifier
    SEARCH_HOSTS = %w[google.com google.com.br bing.com duckduckgo.com yahoo.com].freeze
    SOCIAL_HOSTS = %w[instagram.com facebook.com linkedin.com t.co x.com twitter.com].freeze
    AUTH_HOSTS = %w[accounts.google.com appleid.apple.com login.microsoftonline.com auth.avaliasolar.com.br].freeze
    INTERNAL_HOSTS = %w[avaliasolar.com.br www.avaliasolar.com.br app.avaliasolar.com.br crm.avaliasolar.com.br].freeze
    PAID_SEARCH_MEDIA = %w[cpc ppc paid_search paid-search search_paid].freeze
    PAID_SOCIAL_MEDIA = %w[paid_social paid-social social_paid social-ads].freeze

    def self.call(metadata)
      new(metadata).call
    end

    def initialize(metadata)
      @metadata = metadata.is_a?(Hash) ? metadata.stringify_keys : nil
    end

    def call
      return unknown unless @metadata

      source = clean(@metadata['utm_source'])
      medium = clean(@metadata['utm_medium'])
      campaign = clean(@metadata['utm_campaign'])
      return from_utm(source, medium, campaign) if source.present?

      referrer_host = normalize_host(@metadata['referrer_host'] || @metadata['referrer'])
      return direct if referrer_host.blank?
      return system_auth(referrer_host) if auth_host?(referrer_host)
      return internal_traffic_host(referrer_host) if internal_host?(referrer_host)
      return organic_search(referrer_host) if search_host?(referrer_host)
      return organic_social(referrer_host) if social_host?(referrer_host)

      { channel_group: 'Referral', source: referrer_host, medium: 'referral', campaign: nil,
        content: nil, term: nil, attribution_quality: 'referrer' }
    end

    private

    def from_utm(source, medium, campaign)
      channel = if medium.in?(PAID_SEARCH_MEDIA) || (medium == 'cpc' && search_host?(source))
                  'Paid Search'
                elsif medium.in?(PAID_SOCIAL_MEDIA)
                  'Paid Social'
                elsif %w[organic seo].include?(medium)
                  'Organic Search'
                elsif %w[social organic_social].include?(medium)
                  'Organic Social'
                elsif %w[email newsletter].include?(medium)
                  'Email'
                elsif %w[display banner].include?(medium)
                  'Display'
                elsif medium == 'affiliate'
                  'Affiliate'
                else
                  'Other'
                end

      { channel_group: channel, source: source, medium: medium.presence || 'unknown', campaign: campaign,
        content: clean(@metadata['utm_content']), term: clean(@metadata['utm_term']), attribution_quality: 'utm' }
    end

    def normalize_host(value)
      raw = value.to_s.strip
      return nil if raw.blank?
      host = URI.parse(raw.match?(%r{\Ahttps?://}i) ? raw : "https://#{raw}").host
      host.to_s.downcase.sub(/\Awww\./, '').presence
    rescue URI::InvalidURIError
      nil
    end

    def search_host?(value)
      return false if auth_host?(value) || internal_host?(value)

      SEARCH_HOSTS.any? { |host| value == host || value.end_with?(".#{host}") }
    end

    def social_host?(value)
      return false if auth_host?(value) || internal_host?(value)

      SOCIAL_HOSTS.any? { |host| value == host || value.end_with?(".#{host}") }
    end

    def auth_host?(value)
      AUTH_HOSTS.any? { |host| value == host || value.end_with?(".#{host}") }
    end

    def internal_host?(value)
      INTERNAL_HOSTS.any? { |host| value == host || value.end_with?(".#{host}") }
    end

    def system_auth(host)
      { channel_group: 'System/Auth', source: host, medium: 'auth', campaign: nil,
        content: nil, term: nil, attribution_quality: 'system' }
    end

    def internal_traffic_host(host)
      { channel_group: 'Internal', source: host, medium: 'internal', campaign: nil,
        content: nil, term: nil, attribution_quality: 'internal' }
    end

    def organic_search(host)
      { channel_group: 'Organic Search', source: host.sub(/\.com\.br\z/, ''), medium: 'organic', campaign: nil,
        content: nil, term: nil, attribution_quality: 'referrer' }
    end

    def organic_social(host)
      { channel_group: 'Organic Social', source: host.split('.').first, medium: 'organic_social', campaign: nil,
        content: nil, term: nil, attribution_quality: 'referrer' }
    end

    def direct
      { channel_group: 'Direct', source: 'direct', medium: 'direct', campaign: nil, content: nil, term: nil,
        attribution_quality: 'direct' }
    end

    def unknown
      { channel_group: 'Unknown', source: 'unknown', medium: 'unknown', campaign: nil, content: nil, term: nil,
        attribution_quality: 'unknown' }
    end

    def clean(value)
      value.to_s.strip.downcase.presence
    end
  end
end
