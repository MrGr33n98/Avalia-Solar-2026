# frozen_string_literal: true

module Observability
  class SystemHealthService
    class << self
      def check(deep: false)
        db = check_database
        redis = check_redis
        sidekiq = check_sidekiq
        outbox = check_outbox

        components = {
          database: db,
          redis: redis,
          sidekiq: sidekiq,
          outbox: outbox
        }

        if deep
          components[:puma] = check_puma
          components[:system] = check_system
        end

        overall_status = determine_overall_status(components)

        result = {
          status: overall_status,
          collected_at: Time.current.iso8601,
          deployment_version: ENV['GIT_SHA'] || ENV['APP_VERSION'] || 'unknown',
          environment: Rails.env,
          components: components
        }

        Observability::Sanitizer.sanitize(result)
      end

      private

      def check_database
        start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        ActiveRecord::Base.connection.execute('SELECT 1')
        latency = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round(2)

        pool = ActiveRecord::Base.connection_pool
        {
          status: latency > 500 ? 'degraded' : 'healthy',
          latency_ms: latency,
          pool_size: pool ? pool.size : 0,
          active_connections: pool ? pool.connections.count : 0
        }
      rescue StandardError => e
        {
          status: 'unhealthy',
          error: e.class.name,
          message: e.message
        }
      end

      def check_redis
        return { status: 'not_configured' } unless defined?(Redis)

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
          connected_clients: info['connected_clients']&.to_i || 0
        }
      rescue StandardError => e
        {
          status: 'unhealthy',
          error: e.class.name,
          message: e.message
        }
      end

      def check_sidekiq
        return { status: 'not_configured' } unless defined?(Sidekiq)

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
          queues: queues
        }
      rescue StandardError => e
        {
          status: 'unhealthy',
          error: e.class.name,
          message: e.message
        }
      end

      def check_outbox
        Observability::OutboxMetrics.collect
      end

      def check_puma
        puma_stats = if defined?(Puma) && Puma.respond_to?(:stats)
                       begin
                         JSON.parse(Puma.stats)
                       rescue StandardError
                         {}
                       end
                     else
                       {}
                     end

        {
          status: 'healthy',
          workers: puma_stats['workers'] || 1,
          booted_workers: puma_stats['booted_workers'] || 1,
          running_threads: puma_stats['running'] || 5,
          backlog: puma_stats['backlog'] || 0
        }
      rescue StandardError => e
        {
          status: 'not_available',
          error: e.message
        }
      end

      def check_system
        uptime_seconds = begin
          Time.current - (Rails.application.config.app_start_time || Time.current)
        rescue StandardError
          0
        end

        rss_mb = if RUBY_PLATFORM.include?('linux') || RUBY_PLATFORM.include?('darwin')
                   begin
                     `ps -o rss= -p #{Process.pid}`.to_i / 1024
                   rescue StandardError
                     0
                   end
                 else
                   0
                 end

        {
          uptime_seconds: uptime_seconds.to_i,
          memory_rss_mb: rss_mb
        }
      rescue StandardError => e
        {
          status: 'not_available',
          error: e.message
        }
      end

      def determine_overall_status(components)
        statuses = components.values.map { |c| c[:status] }
        if statuses.include?('unhealthy') || statuses.include?('critical')
          'critical'
        elsif statuses.include?('degraded') || statuses.include?('warning')
          'degraded'
        else
          'healthy'
        end
      end
    end
  end
end
