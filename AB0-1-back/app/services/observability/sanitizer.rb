# frozen_string_literal: true

module Observability
  module Sanitizer
    SENSITIVE_KEYS = %w[
      password
      password_confirmation
      token
      jwt
      jwt_token
      secret
      secret_key
      api_key
      access_token
      refresh_token
      authorization
      stripe_secret
      stripe_key
      private_key
      cvv
      credit_card
      card_number
      cpf
      phone
    ].freeze

    FILTERED = '[FILTERED]'

    def self.sanitize(data)
      case data
      when Hash
        data.each_with_object({}) do |(key, value), acc|
          if sensitive_key?(key)
            acc[key] = FILTERED
          else
            acc[key] = sanitize(value)
          end
        end
      when Array
        data.map { |item| sanitize(item) }
      when String
        sanitize_string(data)
      else
        data
      end
    end

    def self.sensitive_key?(key)
      k = key.to_s.downcase
      SENSITIVE_KEYS.any? { |sensitive| k.include?(sensitive) }
    end

    def self.sanitize_string(str)
      return str if str.frozen? && str.empty?

      cleaned = str.dup
      # Redact Bearer tokens
      cleaned.gsub!(/Bearer\s+[A-Za-z0-9\-._~+\/]+=*/i, 'Bearer [FILTERED]')
      # Redact JWT tokens (3 parts separated by dots)
      cleaned.gsub!(/eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/, '[FILTERED_JWT]')
      # Redact Stripe secret keys
      cleaned.gsub!(/sk_(live|test)_[0-9a-zA-Z]{24,}/, 'sk_\\1_[FILTERED]')
      cleaned
    end
  end
end
