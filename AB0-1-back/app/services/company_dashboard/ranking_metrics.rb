# frozen_string_literal: true

module CompanyDashboard
  # Métricas são estritamente observacionais: uma falha de telemetria não pode
  # impedir uma resposta de ranking ou a execução do worker.
  module RankingMetrics
    module_function

    def request(mode:, status:, duration_ms:, population:)
      increment(:ranking_requests_total, mode: mode, status: status)
      observe(:ranking_api_duration, duration_ms.to_f / 1000, mode: mode, status: status)
      observe(:ranking_eligible_population, population.to_f, mode: mode)
    end

    def failure(duration_ms:)
      increment(:ranking_failures_total, status: '500')
      observe(:ranking_api_duration, duration_ms.to_f / 1000, mode: 'unknown', status: 'error')
    end

    def worker(duration_ms:, snapshots:)
      observe(:ranking_worker_duration, duration_ms.to_f / 1000, pipeline: 'ranking_score')
      set(:ranking_snapshot_freshness_hours, 0, scope: 'all') if snapshots.to_i.positive?
    end

    def increment(metric, tags)
      collector(metric)&.increment(tags, by: 1)
    rescue StandardError => e
      Rails.logger.warn("[RankingMetrics] #{metric}: #{e.message}")
    end

    def observe(metric, value, tags)
      collector(metric)&.observe(tags, value)
    rescue StandardError => e
      Rails.logger.warn("[RankingMetrics] #{metric}: #{e.message}")
    end

    def set(metric, value, tags)
      collector(metric)&.set(tags, value)
    rescue StandardError => e
      Rails.logger.warn("[RankingMetrics] #{metric}: #{e.message}")
    end

    def collector(metric)
      return unless defined?(Yabeda) && Yabeda.respond_to?(:ab0)

      namespace = Yabeda.ab0
      namespace.public_send(metric) if namespace.respond_to?(metric)
    end
  end
end
