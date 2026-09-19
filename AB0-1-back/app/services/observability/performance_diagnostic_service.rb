# frozen_string_literal: true

module Observability
  class PerformanceDiagnosticService
    class << self
      def diagnose(window_minutes: 15)
        window_start = window_minutes.minutes.ago
        window_end = Time.current

        health = Observability::SystemHealthService.check(deep: true)
        outbox_metrics = Observability::OutboxMetrics.collect

        observations = []
        correlations = []
        hypotheses = []
        confirmed_causes = []
        recommendations = []
        limitations = []

        # 1. Database analysis
        db_comp = health.dig(:components, :database) || {}
        if db_comp[:status] == 'unhealthy'
          observations << { layer: 'postgresql', level: 'error', finding: "DB connectivity failed: #{db_comp[:error]}", classification: 'CONFIRMED' }
          confirmed_causes << { layer: 'postgresql', cause: 'Database connection failure', evidence: db_comp }
          recommendations << 'Check PostgreSQL service health and credentials.'
        elsif db_comp[:latency_ms].to_f > 200.0
          observations << { layer: 'postgresql', level: 'warn', finding: "DB latency elevated: #{db_comp[:latency_ms]}ms", classification: 'OBSERVED' }
          hypotheses << { layer: 'postgresql', hypothesis: 'High DB query load or lock contention causing slow response', classification: 'LIKELY' }
          recommendations << 'Inspect slow queries via pg_stat_statements or ActiveRecord query logs.'
        else
          observations << { layer: 'postgresql', level: 'info', finding: "DB latency normal: #{db_comp[:latency_ms]}ms", classification: 'OBSERVED' }
        end

        # 2. Redis analysis
        redis_comp = health.dig(:components, :redis) || {}
        if redis_comp[:status] == 'unhealthy'
          observations << { layer: 'redis', level: 'error', finding: "Redis ping failed: #{redis_comp[:error]}", classification: 'CONFIRMED' }
          confirmed_causes << { layer: 'redis', cause: 'Redis unavailable', evidence: redis_comp }
          recommendations << 'Check Redis container and network configuration.'
        elsif redis_comp[:latency_ms].to_f > 50.0
          observations << { layer: 'redis', level: 'warn', finding: "Redis latency elevated: #{redis_comp[:latency_ms]}ms", classification: 'OBSERVED' }
          hypotheses << { layer: 'redis', hypothesis: 'Redis memory pressure or command blocking', classification: 'LIKELY' }
        else
          observations << { layer: 'redis', level: 'info', finding: 'Redis connection healthy', classification: 'OBSERVED' }
        end

        # 3. Sidekiq analysis
        sidekiq_comp = health.dig(:components, :sidekiq) || {}
        if sidekiq_comp[:status] == 'critical'
          observations << { layer: 'sidekiq', level: 'error', finding: "Sidekiq queue latency or retries critical (max latency: #{sidekiq_comp[:max_latency_seconds]}s)", classification: 'OBSERVED' }
          correlations << { layers: %w[sidekiq outbox], note: 'Sidekiq queue latency may correlate with slow background consumer dispatch', classification: 'CORRELATED' }
          recommendations << 'Scale Sidekiq concurrency or investigate failing jobs in retry queue.'
        elsif sidekiq_comp[:status] == 'degraded'
          observations << { layer: 'sidekiq', level: 'warn', finding: "Sidekiq degraded: enqueued=#{sidekiq_comp[:enqueued]}, busy=#{sidekiq_comp[:busy]}", classification: 'OBSERVED' }
        else
          observations << { layer: 'sidekiq', level: 'info', finding: 'Sidekiq worker queues healthy', classification: 'OBSERVED' }
        end

        # 4. Outbox analysis
        if outbox_metrics[:status] == 'critical'
          observations << { layer: 'outbox', level: 'error', finding: "Outbox dead letter events present: #{outbox_metrics.dig(:metrics, :dead_letter_count)}", classification: 'CONFIRMED' }
          confirmed_causes << { layer: 'outbox', cause: 'Dead-letter events requiring investigation', evidence: outbox_metrics }
          recommendations << 'Inspect dead letter domain events for poison payloads or consumer failures.'
        elsif outbox_metrics[:status] == 'degraded'
          observations << { layer: 'outbox', level: 'warn', finding: "Outbox pending backlog elevated: #{outbox_metrics.dig(:metrics, :pending_count)}", classification: 'OBSERVED' }
          hypotheses << { layer: 'outbox', hypothesis: 'Outbox dispatcher throughput lower than event generation rate', classification: 'LIKELY' }
          recommendations << 'Trigger Outbox dispatcher run or check Sidekiq Outbox dispatch worker.'
        else
          observations << { layer: 'outbox', level: 'info', finding: 'Outbox backlog normal', classification: 'OBSERVED' }
        end

        # 5. Container / VM telemetry limitation note
        limitations << 'VM and Host container metrics require Observability MCP agent in staging/production.'
        limitations << 'Browser Web Vitals collected asynchronously via PostHog / Next.js client telemetry.'

        status = if confirmed_causes.any? || health[:status] == 'critical'
                   'critical'
                 elsif hypotheses.any? || health[:status] == 'degraded'
                   'degraded'
                 else
                   'healthy'
                 end

        result = {
          status: status,
          observations: observations,
          correlations: correlations,
          hypotheses: hypotheses,
          confirmed_causes: confirmed_causes,
          recommendations: recommendations,
          metrics: {
            database: db_comp,
            redis: redis_comp,
            sidekiq: sidekiq_comp,
            outbox: outbox_metrics[:metrics] || {}
          },
          evidence: [
            { source: 'ActiveRecord::Base', data: db_comp },
            { source: 'Redis', data: redis_comp },
            { source: 'Sidekiq::Stats', data: sidekiq_comp },
            { source: 'DomainEvent (Outbox)', data: outbox_metrics }
          ],
          window: {
            from: window_start.iso8601,
            to: window_end.iso8601,
            duration_minutes: window_minutes
          },
          collected_at: Time.current.iso8601,
          limitations: limitations
        }

        Observability::Sanitizer.sanitize(result)
      end
    end
  end
end
