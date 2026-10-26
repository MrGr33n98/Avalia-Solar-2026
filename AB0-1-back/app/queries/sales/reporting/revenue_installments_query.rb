# frozen_string_literal: true

module Sales
  module Reporting
    class RevenueInstallmentsQuery
      def self.call(opportunity_scope:)
        opp_ids = opportunity_scope.select(:id)
        installments = ::Sales::OpportunityInstallment.where(sales_opportunity_id: opp_ids)

        return default_result if installments.empty?

        collected = installments.where(status: 'collected')
        planned = installments.where(status: 'planned')
        overdue = installments.overdue

        now = Date.current
        next_30d = planned.where(due_date: now..(now + 30.days))
        next_90d = planned.where(due_date: now..(now + 90.days))

        {
          has_installments: true,
          total_installments_count: installments.count,
          collected_cents: collected.sum(:amount_cents) || 0,
          planned_cents: planned.sum(:amount_cents) || 0,
          overdue_cents: overdue.sum(:amount_cents) || 0,
          due_next_30d_cents: next_30d.sum(:amount_cents) || 0,
          due_next_90d_cents: next_90d.sum(:amount_cents) || 0
        }
      end

      def self.default_result
        {
          has_installments: false,
          total_installments_count: 0,
          collected_cents: 0,
          planned_cents: 0,
          overdue_cents: 0,
          due_next_30d_cents: 0,
          due_next_90d_cents: 0
        }
      end
    end
  end
end
