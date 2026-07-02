# frozen_string_literal: true

module Mcp
  class CompanyProfileService < BaseService
    def call
      company = Company.includes(:categories).find(find_company!(scope: active_companies).id)
      { company: public_company(company).merge(website: company.website, coverage_states: company.coverage_state_list, coverage_cities: company.coverage_city_list) }
    end
  end
end
