# frozen_string_literal: true

module Sales
  module Reporting
    class StageDurationQuery
      def self.call(opportunity_scope:)
        opp_ids = opportunity_scope.select(:id)
        histories = ::Sales::StageHistory.where(sales_opportunity_id: opp_ids)
                                          .where.not(duration_seconds: nil)
                                          .where('duration_seconds > 0')

        return [] if histories.empty?

        stages = ::Sales::Stage.order(:position).index_by(&:id)
        grouped = histories.group(:to_stage_id).pluck(
          :to_stage_id,
          Arel.sql('COUNT(*) AS transitions_count'),
          Arel.sql('AVG(duration_seconds) AS avg_duration_seconds')
        )

        grouped.map do |stage_id, count, avg_secs|
          stage = stages[stage_id]
          avg_days = (avg_secs.to_f / 1.day).round(1)
          {
            stage_id: stage_id,
            stage_name: stage&.name || "Estágio ##{stage_id}",
            count: count,
            avg_days: avg_days,
            avg_hours: (avg_secs.to_f / 1.hour).round(1)
          }
        end.sort_by { |item| stages[item[:stage_id]]&.position || 0 }
      end
    end
  end
end
