# frozen_string_literal: true

module CorporateDomain
  class Validator
    DEFAULT_ALLOWED_DOMAINS = %w[weg.net genialinvestimentos.com.br].freeze

    def initialize(allowed_domains: nil)
      configured_domains = allowed_domains.presence || ENV['CORPORATE_ALLOWED_EMAIL_DOMAINS']
      @allowed_domains = normalize_domains(configured_domains)
    end

    attr_reader :allowed_domains

    def valid_email?(email)
      email_domain = extract_domain(email)
      return false if email_domain.blank?

      allowed_domains.include?(email_domain)
    end

    def extract_domain(email)
      _, domain = email.to_s.strip.downcase.split('@', 2)
      domain.presence
    end

    def invalid_message
      "Email deve pertencer a um dos domínios corporativos permitidos (#{allowed_domains.join(', ')})"
    end

    private

    def normalize_domains(raw_domains)
      values =
        case raw_domains
        when String
          raw_domains.split(',')
        when Array
          raw_domains
        else
          DEFAULT_ALLOWED_DOMAINS
        end

      normalized = values.map { |value| value.to_s.strip.downcase.sub(/\A@/, '') }.reject(&:blank?).uniq
      normalized.presence || DEFAULT_ALLOWED_DOMAINS
    end
  end
end
