# frozen_string_literal: true

module Mcp
  class MarketSnapshotService < BaseService
    def call
      state = arguments[:state].to_s.upcase.presence
      company_scope = active_companies
      company_scope = company_scope.where(state: state) if state
      lead_scope = Lead.where(created_at: period_days.days.ago..Time.current)
      lead_scope = lead_scope.where(state: state) if state

      {
        period_days: period_days,
        state: state,
        companies: {
          total: company_scope.count,
          verified: company_scope.where(verified: true).count,
          average_rating: company_scope.average(:rating_avg)&.to_f || 0.0,
          top_cities: company_scope.where.not(city: [nil, '']).group(:city).order(Arel.sql('count_all DESC')).limit(10).count
        },
        products: { active_total: Product.active_status.count },
        reviews: { approved_in_period: Review.approved_only.where(created_at: period_days.days.ago..Time.current).count },
        leads: { total_in_period: lead_scope.count, by_vertical: lead_scope.group(:product_vertical).count }
      }
    end
  end
end
