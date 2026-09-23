# frozen_string_literal: true

module CompanyDashboard
  module Positioning
    class ThresholdCalculator
      def initialize(points)
        @points = points
      end

      def call
        x_values = @points.filter_map { |point| point[:x_score]&.to_f }.sort
        y_values = @points.filter_map { |point| point[:y_score]&.to_f }.sort
        {
          method: Definition::THRESHOLD_METHOD,
          population_size: @points.length,
          x_threshold: median(x_values),
          y_threshold: median(y_values),
          distinct_x: x_values.uniq.length,
          distinct_y: y_values.uniq.length
        }
      end

      private

      def median(values)
        return nil if values.empty?

        middle = values.length / 2
        return values[middle].round(2) if values.length.odd?

        ((values[middle - 1] + values[middle]) / 2.0).round(2)
      end
    end
  end
end
