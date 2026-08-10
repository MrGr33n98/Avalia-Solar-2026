module Banners
  # Instrumentação opcional: falha de métrica nunca pode quebrar anúncio ou conversão.
  module Metrics
    module_function

    def delivery(status:, position:, source:)
      increment(:banner_deliveries_total, status: status, position: position, source: source)
    end

    def event(event_type:, status:, quality:, discard_reason: 'none')
      increment(:banner_events_total, event_type: event_type, status: status, quality: quality,
                discard_reason: discard_reason.presence || 'none')
    end

    def attribution(status:)
      increment(:banner_attributions_total, status: status)
    end

    def reconciliation(status:, metric:)
      increment(:banner_reconciliation_total, status: status, metric: metric.to_s)
    end

    def health_gauges(discard_rate:, lag_minutes:, source: 'dashboard')
      set_gauge(:banner_operational_health_discard_rate, discard_rate, source: source)
      set_gauge(:banner_operational_health_lag_minutes, lag_minutes || 0, source: source)
    end

    def retention(candidates:, oldest_age_days:)
      set_gauge(:banner_audit_retention_candidates, candidates, {})
      set_gauge(:banner_audit_retention_oldest_age_days, oldest_age_days || 0, {})
    end

    def duration(seconds, source: 'dashboard')
      return unless defined?(Yabeda) && Yabeda.respond_to?(:ab0)
      collector = Yabeda.ab0
      return unless collector.respond_to?(:banner_operational_health_duration)

      collector.banner_operational_health_duration.observe({ source: source }, seconds.to_f)
    rescue StandardError => e
      Rails.logger.warn("[BannerMetrics] duration: #{e.message}") if defined?(Rails)
    end

    def set_gauge(metric, value, tags)
      return unless defined?(Yabeda) && Yabeda.respond_to?(:ab0)
      collector = Yabeda.ab0
      return unless collector.respond_to?(metric)

      collector.public_send(metric).set(tags, value.to_f)
    rescue StandardError => e
      Rails.logger.warn("[BannerMetrics] #{metric}: #{e.message}") if defined?(Rails)
    end

    def increment(metric, tags)
      return unless defined?(Yabeda) && Yabeda.respond_to?(:ab0)
      collector = Yabeda.ab0
      return unless collector.respond_to?(metric)

      collector.public_send(metric).increment(tags, by: 1)
    rescue StandardError => e
      Rails.logger.warn("[BannerMetrics] #{metric}: #{e.message}") if defined?(Rails)
    end
  end
end
