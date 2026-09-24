# frozen_string_literal: true

module Ranking
  class PositioningResolver
    MIN_BENCHMARK_POPULATION = 5

    def resolve(scope, population_data = [])
      pop_size = population_data.size

      if pop_size < MIN_BENCHMARK_POPULATION
        return {
          analysis_available: false,
          reason: :insufficient_population_for_benchmark,
          observed_population: pop_size,
          required_population: MIN_BENCHMARK_POPULATION,
          quadrant: nil,
          percentiles: nil
        }
      end

      # Calculate benchmark stats
      scores = population_data.map { |d| d[:score].to_f }.sort
      median = scores[scores.size / 2]

      {
        analysis_available: true,
        reason: :benchmark_computed,
        observed_population: pop_size,
        required_population: MIN_BENCHMARK_POPULATION,
        median_score: median,
        percentiles: {
          p25: scores[(scores.size * 0.25).to_i],
          p50: median,
          p75: scores[(scores.size * 0.75).to_i]
        }
      }
    end
  end
end
