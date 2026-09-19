# frozen_string_literal: true

module Mcp
  module Observability
    class SidekiqHealthToolService < Mcp::BaseService
      def call
        return { status: 'not_configured', collected_at: Time.current.iso8601 } unless defined?(Sidekiq)

        stats = Sidekiq::Stats.new
        processes = Sidekiq::ProcessSet.new.size
        queues = Sidekiq::Queue.all.map do |q|
          {
            name: q.name,
            size: q.size,
            latency_seconds: q.latency.to_f.round(2)
          }
        end

        max_latency = queues.map { |q| q[:latency_seconds] }.max || 0.0
        status = if processes.zero?
                   'degraded'
                 elsif stats.retry_size > 50 || max_latency > 300
                   'critical'
                 elsif stats.enqueued > 100 || max_latency > 60
                   'degraded'
                 else
                   'healthy'
                 end

        {
          status: status,
          processes: processes,
          enqueued: stats.enqueued,
          busy: stats.processed,
          failed: stats.failed,
          retry_size: stats.retry_size,
          dead_size: stats.dead_size,
          max_latency_seconds: max_latency,
          queues: queues,
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
