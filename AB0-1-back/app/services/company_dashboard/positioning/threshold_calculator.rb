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

        floor_count_y = y_values.count { |v| v <= 3.0 }
        floor_ratio_y = pop_size.positive? ? (floor_count_y.to_f / pop_size).round(2) : 0.0

        p10_y = percentile(y_values, 0.10)
        p25_y = percentile(y_values, 0.25)
        p75_y = percentile(y_values, 0.75)
        p90_y = percentile(y_values, 0.90)
        iqr_y = p75_y && p25_y ? (p75_y - p25_y).round(2) : nil
        effective_range_y = p90_y && p10_y ? (p90_y - p10_y).round(2) : nil

        is_collapsed_y = pop_size.positive? && (
          y_median.to_f.zero? || y_median.to_f <= 2.5 || (pop_size >= 5 && floor_ratio_y >= 0.5)
        )

        {
          method: Definition::THRESHOLD_METHOD,
          population_size: pop_size,
          x_threshold: x_median,
          y_threshold: y_median,
          p50_x: x_median,
          p50_y: y_median,
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
          floor_count_y: floor_count_y,
          floor_ratio_y: floor_ratio_y,
          p10_y: p10_y,
          p25_y: p25_y,
          p75_y: p75_y,
          p90_y: p90_y,
          iqr_y: iqr_y,
          effective_range_y: effective_range_y,
          collapsed_y: is_collapsed_y
        }
      end

      private

      def median(values)
        return nil if values.empty?

        middle = values.length / 2
        return values[middle].round(2) if values.length.odd?

        ((values[middle - 1] + values[middle]) / 2.0).round(2)
      end

      def percentile(sorted_values, pct)
        return nil if sorted_values.empty?
        return sorted_values.first if sorted_values.length == 1

        rank = (sorted_values.length - 1) * pct
        lower = rank.floor
        upper = rank.ceil
        return sorted_values[lower] if lower == upper

        (sorted_values[lower] + ((sorted_values[upper] - sorted_values[lower]) * (rank - lower))).round(2)
      end
    end
  end
end
