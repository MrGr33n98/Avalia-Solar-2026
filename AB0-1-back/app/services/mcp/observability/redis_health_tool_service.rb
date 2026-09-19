# frozen_string_literal: true

module Mcp
  module Observability
    class RedisHealthToolService < Mcp::BaseService
      def call
        return { status: 'not_configured', collected_at: Time.current.iso8601 } unless defined?(Redis)

        start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        redis_url = ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
        redis = Redis.new(url: redis_url, timeout: 1.0)
        pong = redis.ping
        latency = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round(2)

        info = begin
          redis.info
        rescue StandardError
          {}
        end
        memory_used_mb = (info['used_memory'].to_i / (1024.0 * 1024.0)).round(2)

        {
          status: pong == 'PONG' ? 'healthy' : 'unhealthy',
          latency_ms: latency,
          memory_used_mb: memory_used_mb,
          connected_clients: info['connected_clients']&.to_i || 0,
          blocked_clients: info['blocked_clients']&.to_i || 0,
          collected_at: Time.current.iso8601
        }
      rescue StandardError => e
        {
          status: 'unhealthy',
          error: e.class.name,
          message: e.message,
          collected_at: Time.current.iso8601
        }
      end
    end
  end
end
