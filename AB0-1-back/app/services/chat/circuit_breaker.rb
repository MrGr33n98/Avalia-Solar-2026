# frozen_string_literal: true

module Chat
  class CircuitBreaker
    FAILURE_THRESHOLD = 5
    OPEN_TTL = 60.seconds

    def self.allow?(provider:)
      key = "chat:circuit:#{provider}:opened"
      !Rails.cache.exist?(key)
    end

    def self.failure!(provider:)
      key = "chat:circuit:#{provider}:failures"
      count = Rails.cache.increment(key, 1, expires_in: 5.minutes, raw: true).to_i
      Rails.cache.write("chat:circuit:#{provider}:opened", true, expires_in: OPEN_TTL) if count >= FAILURE_THRESHOLD
    end

    def self.success!(provider:)
      Rails.cache.delete("chat:circuit:#{provider}:failures")
      Rails.cache.delete("chat:circuit:#{provider}:opened")
    end
  end
end
