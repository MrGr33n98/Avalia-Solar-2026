# frozen_string_literal: true

module TrustScore
  # Definição canônica do score de confiança. Ela recebe somente sinais já
  # materializados na empresa, o que permite que o recálculo unitário e o lote
  # diário produzam exatamente o mesmo resultado.
  class Definition
    VERSION = 'trust-score-v1'

    WEIGHTS = {
      base: 50.0,
      verification: 20.0,
      rating: 20.0,
      reviews: 10.0,
      engagement: 10.0,
      leads: 10.0
    }.freeze

    MAX_VALUES = {
      rating: 5.0,
      reviews: 100.0,
      engagement: 500.0,
      leads: 100.0
    }.freeze

    def self.calculate(verified:, rating_avg:, reviews_count:, profile_views_count:, cta_clicks_count:, leads_count:)
      components = {
        definition_version: VERSION,
        base: WEIGHTS[:base],
        verification: verified ? WEIGHTS[:verification] : 0.0,
        rating: normalized_linear(rating_avg, MAX_VALUES[:rating], WEIGHTS[:rating]),
        reviews: normalized_linear(reviews_count, MAX_VALUES[:reviews], WEIGHTS[:reviews]),
        engagement: normalized_log(profile_views_count.to_f + (cta_clicks_count.to_f * 2)),
        leads: normalized_linear(leads_count, MAX_VALUES[:leads], WEIGHTS[:leads]),
        penalty: 0.0
      }

      score = WEIGHTS.keys.sum { |key| components.fetch(key) }.clamp(0.0, 100.0).round(2)
      { score: score, components: components }
    end

    def self.normalized_linear(value, maximum, weight)
      return 0.0 if value.to_f <= 0 || maximum.to_f <= 0

      [(value.to_f / maximum.to_f) * weight.to_f, weight.to_f].min
    end
    private_class_method :normalized_linear

    def self.normalized_log(value)
      return 0.0 if value.to_f <= 0

      raw = Math.log(1.0 + [value.to_f, MAX_VALUES[:engagement]].min) / Math.log(1.0 + MAX_VALUES[:engagement])
      raw * WEIGHTS[:engagement]
    end
    private_class_method :normalized_log
  end
end
