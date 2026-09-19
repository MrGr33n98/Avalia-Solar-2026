# frozen_string_literal: true

module Observability
  class OutboxMetrics
    class << self
      def collect
        return not_available_metrics unless domain_event_available?

        pending_count = DomainEvent.where(status: 'pending').count
        processing_count = DomainEvent.where(status: 'processing').count
        failed_count = DomainEvent.where(status: 'failed').where('attempts < ?', 5).count
        dead_letter_count = DomainEvent.where(status: 'failed').where('attempts >= ?', 5).count

        oldest_pending = DomainEvent.where(status: 'pending').order(occurred_at: :asc).first
        oldest_pending_age_seconds = oldest_pending ? (Time.current - oldest_pending.occurred_at).to_f.round(2) : 0.0

        retry_count = DomainEvent.where(status: 'failed').sum(:attempts)

        # Throughput: completed in last 5 minutes
        recent_completed = DomainEvent.where(status: %w[completed published])
                                      .where('processed_at >= ?', 5.minutes.ago)
                                      .count
        throughput_per_minute = (recent_completed / 5.0).round(2)

        health_status = calculate_health(
          pending_count: pending_count,
          dead_letter_count: dead_letter_count,
          oldest_pending_age_seconds: oldest_pending_age_seconds
        )

        {
          status: health_status,
          metrics: {
            pending_count: pending_count,
            processing_count: processing_count,
            failed_count: failed_count,
            dead_letter_count: dead_letter_count,
            oldest_pending_age_seconds: oldest_pending_age_seconds,
            retry_count: retry_count,
            throughput_per_minute: throughput_per_minute
          },
          collected_at: Time.current.iso8601
        }
      rescue StandardError => e
        {
          status: 'error',
          error: e.message,
          collected_at: Time.current.iso8601
        }
      end

      private

      def domain_event_available?
        defined?(DomainEvent) &&
          ActiveRecord::Base.connected? &&
          ActiveRecord::Base.connection.table_exists?('domain_events')
      rescue StandardError
        false
      end

      def calculate_health(pending_count:, dead_letter_count:, oldest_pending_age_seconds:)
        if dead_letter_count.positive? || oldest_pending_age_seconds > 300
          'critical'
        elsif pending_count > 100 || oldest_pending_age_seconds > 60
          'degraded'
        else
          'healthy'
        end
      end

      def not_available_metrics
        {
          status: 'not_available',
          metrics: {},
          collected_at: Time.current.iso8601
        }
      end
    end
  end
end
