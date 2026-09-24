# frozen_string_literal: true

module Ranking
  # Compara a execução do motor legado com o CompatibilityEngine (ORG-003).
  # Identifica drifts de nota, churn de posições e discrepâncias de população em modo shadow (read-only).
  class ShadowEngineComparator
    DEFAULT_TOLERANCE = 0.01

    attr_reader :legacy_population, :canonical_population, :tolerance

    def initialize(legacy_population, canonical_population, tolerance: DEFAULT_TOLERANCE)
      @legacy_population = legacy_population || []
      @canonical_population = canonical_population || []
      @tolerance = tolerance.to_f
    end

    def self.compare(legacy, canonical, tolerance: DEFAULT_TOLERANCE)
      new(legacy, canonical, tolerance: tolerance).compare
    end

    def compare
      legacy_map = @legacy_population.index_by { |item| (item[:id] || item['id']).to_i }
      canonical_map = @canonical_population.index_by { |item| (item[:id] || item['id']).to_i }

      common_ids = legacy_map.keys & canonical_map.keys
      legacy_only = legacy_map.keys - canonical_map.keys
      canonical_only = canonical_map.keys - legacy_map.keys

      score_drifts = []
      position_churn = []

      common_ids.each do |id|
        leg = legacy_map[id]
        can = canonical_map[id]

        leg_score = (leg[:score] || leg[:organic_score] || leg['score']).to_f
        can_score = (can[:organic_score] || can[:score] || can['organic_score']).to_f
        drift = (can_score - leg_score).round(4).abs

        leg_pos = (leg[:position] || leg[:rank_position] || leg['position']).to_i
        can_pos = (can[:position] || can[:rank_position] || can['position']).to_i

        score_drifts << { id: id, legacy_score: leg_score, canonical_score: can_score, drift: drift } if drift > @tolerance
        position_churn << { id: id, legacy_pos: leg_pos, canonical_pos: can_pos } if leg_pos != can_pos
      end

      max_drift = score_drifts.map { |d| d[:drift] }.max || 0.0
      perfect_match = legacy_only.empty? && canonical_only.empty? && score_drifts.empty? && position_churn.empty?

      {
        perfect_match: perfect_match,
        legacy_count: @legacy_population.size,
        canonical_count: @canonical_population.size,
        population_diff: @canonical_population.size - @legacy_population.size,
        common_count: common_ids.size,
        legacy_only_count: legacy_only.size,
        canonical_only_count: canonical_only.size,
        max_score_drift: max_drift,
        drift_count: score_drifts.size,
        position_churn_count: position_churn.size,
        sample_score_drifts: score_drifts.first(10),
        sample_position_churn: position_churn.first(10)
      }
    end
  end
end
