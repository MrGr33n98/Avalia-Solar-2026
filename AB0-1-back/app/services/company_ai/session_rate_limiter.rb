# frozen_string_literal: true

require 'digest'

module CompanyAi
  # A single first-party rate limiter for session creation.
  # Counters must use a shared cache in production; failure is fail-closed.
  class SessionRateLimiter
    MAX_SESSIONS_PER_MINUTE = 10

    def self.allowed?(ip:, company_id:)
      return false if company_id.blank? || ip.blank?

      minute = Time.current.to_i / 60
      fingerprint = Digest::SHA256.hexdigest("#{company_id}:#{ip}:#{minute}")
      key = "company_ai:sessions:v1:#{fingerprint}"
      count = Rails.cache.increment(key, 1, expires_in: 1.minute, raw: true)
      count.is_a?(Numeric) && count <= MAX_SESSIONS_PER_MINUTE
    rescue StandardError => e
      Rails.logger.warn("[CompanyAi::SessionRateLimiter] unavailable=#{e.class}")
      false
    end
  end
end
