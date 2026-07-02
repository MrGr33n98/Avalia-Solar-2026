# frozen_string_literal: true

module Mcp
  class LeadsSummaryService < BaseService
    def call
      company = authorized_company!
      scope = company.leads.where(created_at: period_days.days.ago..Time.current)
      {
        company: { id: company.id, name: company.name },
        period_days: period_days,
        summary: {
          total: scope.count,
          by_status: scope.group(:wizard_status).count,
          by_source: scope.group(:source).count,
          by_city: scope.where.not(city: [nil, '']).group(:city).order(Arel.sql('count_all DESC')).limit(10).count,
          average_score: scope.average(:lead_score)&.to_f || scope.average(:cached_score)&.to_f || 0.0
        }
      }
    end
  end
end
