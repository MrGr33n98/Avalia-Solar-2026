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
        x_median = median(x_values)
        y_median = median(y_values)
        pop_size = @points.length

        zero_count_x = x_values.count(&:zero?)
        zero_count_y = y_values.count(&:zero?)
        zero_ratio_x = pop_size.positive? ? (zero_count_x.to_f / pop_size).round(2) : 0.0
        zero_ratio_y = pop_size.positive? ? (zero_count_y.to_f / pop_size).round(2) : 0.0

        {
          method: Definition::THRESHOLD_METHOD,
          population_size: pop_size,
          x_threshold: x_median,
          y_threshold: y_median,
          distinct_x: x_values.uniq.length,
          distinct_y: y_values.uniq.length,
          zero_count_x: zero_count_x,
          zero_count_y: zero_count_y,
          zero_ratio_x: zero_ratio_x,
          zero_ratio_y: zero_ratio_y,
          min_x: x_values.first,
          max_x: x_values.last,
          min_y: y_values.first,
          max_y: y_values.last,
          collapsed_y: y_median.to_f.zero? && zero_ratio_y >= 0.5
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
