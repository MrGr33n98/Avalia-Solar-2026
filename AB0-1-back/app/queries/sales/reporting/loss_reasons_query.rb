# frozen_string_literal: true

module Sales
  module Reporting
    class LossReasonsQuery
      def self.call(lost_scope:)
        total_lost = lost_scope.count
        return [] if total_lost.zero?

        grouped = lost_scope.group(:lost_reason).count
        colors = %w[#EF4444 #F59E0B #8B5CF6 #EC4899 #3B82F6 #6B7280]

        grouped.map.with_index do |(reason, count), idx|
          pct = ((count.to_f / total_lost) * 100).round
          {
            name: reason.presence || 'Não Especificado',
            count: count,
            value: pct,
            color: colors[idx % colors.length]
          }
        end
      end
    end
  end
end
