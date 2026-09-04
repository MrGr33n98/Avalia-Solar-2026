# frozen_string_literal: true

module Sales
  module Reporting
    class TeamPerformanceQuery
      def self.call(scope:)
        owner_ids = scope.pluck(:owner_id).uniq.compact
        return [] if owner_ids.empty?

        users = User.where(id: owner_ids).index_by(&:id)

        owner_ids.map do |o_id|
          user = users[o_id]
          opps = scope.where(owner_id: o_id)
          won = opps.where(status: 'won')
          lost = opps.where(status: 'lost')
          total_closed = won.count + lost.count
          win_rate = total_closed.positive? ? ((won.count.to_f / total_closed) * 100).round(1) : 0.0

          {
            owner_id: o_id,
            name: user&.name.presence || user&.email&.split('@')&.first&.capitalize || "Vendedor ##{o_id}",
            email: user&.email || '',
            total_deals: opps.count,
            won_deals: won.count,
            lost_deals: lost.count,
            won_revenue_cents: won.sum(:value_cents) || 0,
            win_rate: win_rate
          }
        end.sort_by { |item| -item[:won_revenue_cents] }
      end
    end
  end
end
