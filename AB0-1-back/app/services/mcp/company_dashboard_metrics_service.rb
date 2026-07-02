# frozen_string_literal: true

module Mcp
  class CompanyDashboardMetricsService < BaseService
    def call
      company = authorized_company!
      { company: { id: company.id, name: company.name }, metrics: CompanyDashboard::StatsService.new(company).call }
    end
  end
end
