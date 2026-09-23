# frozen_string_literal: true

module CompanyDashboard
  # Calcula percentis apenas a partir da população elegível recebida. A regra de
  # amostra é configurável para que Produto/Dados possa ajustá-la sem alterar a
  # metodologia do ranking orgânico.
  class RankingBenchmarkService
    DEFAULT_MIN_COMPARABLE_POPULATION = 10

    def self.min_comparable_population
      Integer(ENV.fetch('RANKING_MIN_COMPARABLE_POPULATION', DEFAULT_MIN_COMPARABLE_POPULATION.to_s), 10)
    rescue ArgumentError
      DEFAULT_MIN_COMPARABLE_POPULATION
    end

    class << self
      alias minimum_population min_comparable_population
    end

    def initialize(population:, minimum_population: self.class.min_comparable_population)
      @population = population
      @minimum_population = [minimum_population.to_i, 1].max
    end

    def call
      scores = @population.filter_map { |record| ranking_score_for(record) }.sort
      return empty_payload if scores.empty?
      return insufficient_sample_payload(scores.length) if scores.length < @minimum_population

      {
        status: 'ready',
        population: scores.length,
        minimum_population: @minimum_population,
        median_score: percentile(scores, 50),
        p75_score: percentile(scores, 75),
        p90_score: percentile(scores, 90),
        distribution: distribution_for(scores)
      }
    end

    private

    def empty_payload
      {
        status: 'empty',
        population: 0,
        minimum_population: @minimum_population,
        median_score: nil,
        p75_score: nil,
        p90_score: nil,
        distribution: nil
      }
    end

    def insufficient_sample_payload(population)
      {
        status: 'insufficient_sample',
        population: population,
        minimum_population: @minimum_population,
        median_score: nil,
        p75_score: nil,
        p90_score: nil,
        distribution: nil
      }
    end

    def ranking_score_for(record)
      value = record.respond_to?(:ranking_score) ? record.ranking_score : record[:ranking_score]
      return nil if value.nil?

      value.to_f
    end

    # Interpolação linear entre os valores ordenados: determinística, auditável
    # e independente de qualquer dado sintético.
    def percentile(values, percentile)
      index = (percentile.to_f / 100) * (values.length - 1)
      lower_index = index.floor
      upper_index = index.ceil
      lower = values[lower_index]
      upper = values[upper_index]
      (lower + ((upper - lower) * (index - lower_index))).round(2)
    end

    def distribution_for(scores)
      mean = scores.sum / scores.length.to_f
      variance = scores.sum { |score| (score - mean)**2 } / scores.length.to_f

      {
        min_score: scores.first.round(2),
        max_score: scores.last.round(2),
        mean_score: mean.round(2),
        standard_deviation: Math.sqrt(variance).round(2),
        distinct_score_count: scores.uniq.length
      }
    end
  end
end
