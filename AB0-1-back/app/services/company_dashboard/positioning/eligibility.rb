# frozen_string_literal: true

module CompanyDashboard
  module Positioning
    class Eligibility
      def initialize(minimum_population: RankingBenchmarkService.min_comparable_population)
        @minimum_population = [minimum_population.to_i, 1].max
      end

      def call(points)
        distinct_x = distinct_values(points, :x_score)
        distinct_y = distinct_values(points, :y_score)
        population = points.length
        flags = quality_flags(population, distinct_x, distinct_y)

        {
          status: status_for(population, flags),
          population_size: population,
          minimum_population: @minimum_population,
          distinct_x: distinct_x,
          distinct_y: distinct_y,
          quality_flags: flags
        }
      end

      private

      def distinct_values(points, key)
        points.map { |point| point[key].to_f }.uniq.length
      end

      def quality_flags(population, distinct_x, distinct_y)
        [].tap do |flags|
          flags << 'insufficient_population' if population < @minimum_population
          flags << 'degenerate_x_distribution' if population.positive? && distinct_x < 2
          flags << 'degenerate_y_distribution' if population.positive? && distinct_y < 2
        end
      end

      def status_for(population, flags)
        return 'empty' if population.zero?

        flags.empty? ? 'ready' : 'insufficient_sample'
      end
    end
  end
end
