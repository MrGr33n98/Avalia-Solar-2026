# frozen_string_literal: true

module Sales
  module Reporting
    class CompetitorLossesQuery
      def self.call(lost_scope:)
        lost_opp_ids = lost_scope.select(:id)
        opp_competitors = ::Sales::OpportunityCompetitor.where(sales_opportunity_id: lost_opp_ids)
        return [] if opp_competitors.empty?

        competitors = ::Sales::Competitor.index_by(&:id)

        grouped = opp_competitors.group(:sales_competitor_id).pluck(
          :sales_competitor_id,
          Arel.sql('COUNT(*) AS count')
        )

        total_tracked = grouped.sum { |_, count| count }
        colors = %w[#EF4444 #F59E0B #8B5CF6 #3B82F6 #EC4899 #6B7280]

        grouped.map.with_index do |(comp_id, count), idx|
          comp = competitors[comp_id]
          pct = total_tracked.positive? ? ((count.to_f / total_tracked) * 100).round : 0
          {
            competitor_id: comp_id,
            name: comp&.name || "Concorrente ##{comp_id}",
            count: count,
            value: pct,
            color: colors[idx % colors.length]
          }
        end.sort_by { |item| -item[:count] }
      end
    end
  end
end
