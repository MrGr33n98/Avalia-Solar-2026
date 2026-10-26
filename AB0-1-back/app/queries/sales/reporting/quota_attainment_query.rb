# frozen_string_literal: true

module Sales
  module Reporting
    class QuotaAttainmentQuery
      def self.call(user:, date: Date.current, won_scope:)
        company_id = user.respond_to?(:company_id) ? user.company_id : nil
        quotas = ::Sales::Quota.for_period(date)
        quotas = quotas.where(company_id: company_id) if company_id.present?

        return default_result if quotas.empty?

        total_target_cents = quotas.sum(:target_revenue_cents)
        total_target_deals = quotas.sum(:target_deals_count)
        actual_won_cents = won_scope.sum(:value_cents) || 0
        actual_won_deals = won_scope.count

        overall_attainment = total_target_cents.positive? ? ((actual_won_cents.to_f / total_target_cents) * 100).round(1) : 0.0

        first_quota = quotas.first
        ideal_pace = first_quota ? first_quota.ideal_pace_percent(date) : 0.0

        user_quotas = quotas.map do |q|
          rep_won = won_scope.where(owner_id: q.user_id)
          rep_revenue = rep_won.sum(:value_cents) || 0
          rep_deals = rep_won.count
          {
            user_id: q.user_id,
            user_name: q.user&.name || "Vendedor ##{q.user_id}",
            target_cents: q.target_revenue_cents,
            actual_cents: rep_revenue,
            attainment_percent: q.attainment_percent(rep_revenue),
            target_deals: q.target_deals_count,
            actual_deals: rep_deals
          }
        end

        {
          has_quota: true,
          target_cents: total_target_cents,
          actual_cents: actual_won_cents,
          target_deals: total_target_deals,
          actual_deals: actual_won_deals,
          attainment_percent: overall_attainment,
          ideal_pace_percent: ideal_pace,
          pace_status: overall_attainment >= ideal_pace ? 'on_track' : 'behind_pace',
          reps: user_quotas
        }
      end

      def self.default_result
        {
          has_quota: false,
          target_cents: 0,
          actual_cents: 0,
          target_deals: 0,
          actual_deals: 0,
          attainment_percent: 0.0,
          ideal_pace_percent: 0.0,
          pace_status: 'no_quota',
          reps: []
        }
      end
    end
  end
end
