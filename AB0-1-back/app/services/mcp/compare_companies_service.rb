# frozen_string_literal: true

module Mcp
  class CompareCompaniesService < BaseService
    def call
      ids = Array(arguments[:company_ids]).map(&:to_s).uniq.first(3)
      raise Error.new(code: 'invalid_params', message: 'Informe de 2 a 3 empresas.') unless ids.length.between?(2, 3)

      companies = active_companies.includes(:categories).where(id: ids.select { |id| id.match?(/\A\d+\z/) })
      slugs = ids.reject { |id| id.match?(/\A\d+\z/) }
      companies = active_companies.includes(:categories).where(id: companies.select(:id)).or(active_companies.includes(:categories).where(slug: slugs))
      indexed = companies.index_by { |company| [company.id.to_s, company.slug].compact }
      ordered = ids.filter_map { |id| indexed.values.find { |company| company.id.to_s == id || company.slug == id } }
      raise Error.new(code: 'not_found', message: 'Uma ou mais empresas não foram encontradas.', status: :not_found) unless ordered.length == ids.length

      { companies: ordered.map { |company| comparison(company) } }
    end

    private

    def comparison(company)
      public_company(company).merge(
        founded_year: company.founded_year,
        response_time: company.response_time_sla.presence || 'Não informado',
        coverage: { states: company.coverage_state_list, cities: company.coverage_city_list },
        project_types: Array(company.project_types),
        financing: !!company.financing_enabled
      )
    end
  end
end
