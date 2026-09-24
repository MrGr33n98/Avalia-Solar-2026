# frozen_string_literal: true

module CompanyDashboard
  module Positioning
    class PointSelector
      def initialize(leaders_limit: 5, neighbors_limit: 5)
        @leaders_limit = leaders_limit
        @neighbors_limit = neighbors_limit
      end

      def call(population:, company_id:, point_builder:)
        current_index = population.find_index { |record| record.id == company_id }
        leaders = population.first(@leaders_limit)
        neighbors = neighbors_for(population, current_index)
        current = current_index ? population[current_index] : nil
        selected = (leaders + neighbors + [current]).compact.uniq(&:id)
        build_payload(population, leaders, neighbors, selected, point_builder)
      end

      private

      def neighbors_for(population, current_index)
        return [] unless current_index

        from = [current_index - @neighbors_limit, 0].max
        to = [current_index + @neighbors_limit, population.length - 1].min
        population[from..to].reject { |record| record.id == population[current_index].id }
      end

      def build_payload(population, leaders, neighbors, selected, point_builder)
        selected_points = selected.map { |record| point_builder.call(record) }
        {
          points: selected_points,
          displayed_count: selected_points.length,
          eligible_population_count: population.length,
          leaders: leaders.map { |record| point_builder.call(record) },
          neighbors: neighbors.map { |record| point_builder.call(record) }
        }
      end
    end
  end
end
