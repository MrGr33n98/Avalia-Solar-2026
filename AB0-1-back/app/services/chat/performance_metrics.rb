# frozen_string_literal: true

module Chat
  module PerformanceMetrics
    def self.measure(name, session_id: nil)
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      result = yield
      elapsed = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000).round
      Rails.logger.info("[Chat::SLO] metric=#{name} duration_ms=#{elapsed} session_id=#{session_id}")
      result
    rescue StandardError => e
      Rails.logger.warn("[Chat::SLO] metric=#{name} error=#{e.class} session_id=#{session_id}")
      raise
    end
  end
end
