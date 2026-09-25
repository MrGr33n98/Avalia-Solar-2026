# frozen_string_literal: true

module CompanyDashboard
  module Positioning
    class Eligibility
      BLOCKING_FLAGS = %w[
        insufficient_population
        degenerate_x_distribution
        degenerate_y_distribution
        zero_inflated_y
      ].freeze

      WARNING_FLAGS = %w[
        low_spread_y
        floor_concentration_y
      ].freeze

      def initialize(minimum_population: RankingBenchmarkService.min_comparable_population)
        @minimum_population = [minimum_population.to_i, 1].max
      end

      def call(points)
        x_values = points.filter_map { |p| p[:x_score]&.to_f }.sort
        y_values = points.filter_map { |p| p[:y_score]&.to_f }.sort
        population = points.length

        distinct_x = x_values.uniq.length
        distinct_y = y_values.uniq.length
        zero_y = y_values.count(&:zero?)

        stats_y = distribution_stats(y_values)

        blocking = blocking_flags(population, distinct_x, distinct_y, zero_y)
        warnings = warning_flags(population, stats_y)
        all_flags = blocking + warnings

        {
          status: status_for(population, blocking),
          population_size: population,
          minimum_population: @minimum_population,
          distinct_x: distinct_x,
          distinct_y: distinct_y,
          zero_count_y: zero_y,
          quality_flags: all_flags,
          blocking_flags: blocking,
          warning_flags: warnings,
          distribution: {
            y: stats_y
          }
        }
      end

      private

      def distribution_stats(sorted_values)
        return {} if sorted_values.empty?

        n = sorted_values.length
        p10 = percentile(sorted_values, 0.10)
        p25 = percentile(sorted_values, 0.25)
        p50 = percentile(sorted_values, 0.50)
        p75 = percentile(sorted_values, 0.75)
        p90 = percentile(sorted_values, 0.90)
        iqr = (p75 - p25).round(2)
        effective_range = (p90 - p10).round(2)
        floor_count = sorted_values.count { |v| v <= 3.0 }
        floor_ratio = (floor_count.to_f / n).round(2)

        {
          p10: p10,
          p25: p25,
          median: p50,
          p75: p75,
          p90: p90,
          iqr: iqr,
          effective_range: effective_range,
          floor_count: floor_count,
          floor_ratio: floor_ratio
        }
      end

      def percentile(sorted_values, pct)
        return 0.0 if sorted_values.empty?
        return sorted_values.first if sorted_values.length == 1

        rank = (sorted_values.length - 1) * pct
        lower = rank.floor
        upper = rank.ceil
        return sorted_values[lower] if lower == upper

        (sorted_values[lower] + ((sorted_values[upper] - sorted_values[lower]) * (rank - lower))).round(2)
      end

      def blocking_flags(population, distinct_x, distinct_y, zero_y)
        [].tap do |flags|
          flags << 'insufficient_population' if population < @minimum_population
          flags << 'degenerate_x_distribution' if population.positive? && distinct_x < 2
          flags << 'degenerate_y_distribution' if population.positive? && distinct_y < 2
          flags << 'zero_inflated_y' if population.positive? && (zero_y.to_f / population) >= 0.5
        end
      end

      def warning_flags(population, stats_y)
        return [] if population < 5 || stats_y.empty?

        [].tap do |flags|
          if stats_y[:effective_range].to_f < 5.0 || stats_y[:iqr].to_f < 2.0
            flags << 'low_spread_y'
          end

          if stats_y[:floor_ratio].to_f >= 0.50
            flags << 'floor_concentration_y'
          end
        end
      end

      def status_for(population, blocking)
        return 'empty' if population.zero?

        blocking.empty? ? 'ready' : 'insufficient_sample'
      end
    end
  end
end
