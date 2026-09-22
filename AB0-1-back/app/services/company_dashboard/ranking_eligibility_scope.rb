# frozen_string_literal: true

module CompanyDashboard
  # Define a população elegível em um único lugar para leitura de ranking,
  # benchmarks e snapshots. Logo, patrocínio e plano comercial não participam
  # deste escopo nem da ordenação orgânica.
  class RankingEligibilityScope
    ELIGIBILITY_DEFINITION = 'Empresas ativas com ranking score calculado que atendem aos filtros do escopo.'

    def initialize(category_id: nil, state: nil, city: nil, sector: nil)
      @category_id = category_id.presence
      @state = state.to_s.strip.upcase.presence
      @city = city.to_s.strip.presence
      @sector = sector.to_s.strip.presence
    end

    def relation
      scope = Company.active.joins('INNER JOIN company_ranking_score crs ON crs.company_id = companies.id')
      scope = scope.where(id: category_company_ids) if @category_id.present?
      scope = scope.where(companies: { state: @state }) if @state.present?
      scope = apply_city_filter(scope) if @city.present?
      scope = scope.where('companies.project_types @> ?', [@sector].to_json) if @sector.present?
      scope
    end

    private

    def category_company_ids
      Category.where(id: @category_id).joins(:companies).select('companies.id')
    end

    def apply_city_filter(scope)
      normalized_city = normalize_location(@city)
      matching_cities = scope.where.not(companies: { city: [nil, ''] }).distinct.pluck('companies.city')
                             .select { |candidate| normalize_location(candidate) == normalized_city }
      return scope.none if matching_cities.empty?

      scope.where(companies: { city: matching_cities })
    end

    def normalize_location(value)
      I18n.transliterate(value.to_s).downcase.squish
    end
  end
end
