# frozen_string_literal: true

require 'json'

module SaasLeads
  class CategoryAudienceRegistry
    B2B_AUDIENCE = 'b2b'
    B2C_AUDIENCE = 'b2c'
    DEFAULT_B2B_KEYWORDS = %w[
      b2b
      comercial
      comercio
      corporativo
      corporativa
      condominio
      condominios
      industria
      industrial
      empresarial
      saas
    ].freeze

    class << self
      def b2b_category_ids(scope = Category.all)
        enum = scope.respond_to?(:find_each) ? scope.find_each : scope.each

        enum.each_with_object([]) do |category, memo|
          memo << category.id if b2b_category?(category)
        end
      end

      def b2b_category?(category)
        return false if category.nil?

        configured = configured_audience(category)
        return configured == B2B_AUDIENCE if configured.present?

        keyword_match?(category.name)
      end

      def configured_audience(category)
        profile = lead_profile_config(category)
        normalize_audience(profile['audience'] || profile[:audience])
      end

      def normalize_audience(value)
        candidate = value.to_s.strip.downcase
        return nil if candidate.blank?

        return B2B_AUDIENCE if candidate == B2B_AUDIENCE
        return B2C_AUDIENCE if candidate == B2C_AUDIENCE

        nil
      end

      private

      def lead_profile_config(category)
        permissions = normalize_hash(category.permissions_config)
        lead_profile = permissions['lead_profile'] || permissions[:lead_profile]
        normalize_hash(lead_profile)
      end

      def normalize_hash(value)
        case value
        when Hash
          value.deep_stringify_keys
        when String
          parsed = JSON.parse(value)
          parsed.is_a?(Hash) ? parsed.deep_stringify_keys : {}
        else
          {}
        end
      rescue JSON::ParserError
        {}
      end

      def keyword_match?(category_name)
        normalized_name = I18n.transliterate(category_name.to_s).downcase
        DEFAULT_B2B_KEYWORDS.any? { |keyword| normalized_name.include?(keyword) }
      end
    end
  end
end
