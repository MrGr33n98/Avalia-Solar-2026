# frozen_string_literal: true

module Mcp
  module Observability
    class PostgresHealthToolService < Mcp::BaseService
      def call
        start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        ActiveRecord::Base.connection.execute('SELECT 1')
        latency = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round(2)

        pool = ActiveRecord::Base.connection_pool
        {
          status: latency > 500 ? 'degraded' : 'healthy',
          latency_ms: latency,
          pool_size: pool ? pool.size : 0,
          active_connections: pool ? pool.connections.count : 0,
          idle_connections: pool ? (pool.size - pool.connections.count) : 0,
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
