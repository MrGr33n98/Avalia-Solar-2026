# frozen_string_literal: true

module CompanyDashboard
  # As opções de filtro são derivadas da mesma população elegível do ranking.
  # Assim, a UI não oferece um estado/cidade/setor que não possa participar da
  # comparação orgânica. Não há cache de dados de população aqui: a atualização
  # diária de score deve refletir-se imediatamente no contrato.
  class RankingFilterOptionsService
    def self.call(company:, state: nil)
      new(company: company, state: state).call
    end

    def initialize(company:, state:)
      @company = company
      @state = state.to_s.strip.upcase.presence
    end

    def call
      {
        categories: categories,
        states: states,
        sectors: sectors,
        cities: cities,
        selected_state: @state
      }
    end

    private

    def base_population
      @base_population ||= RankingEligibilityScope.new.relation
    end

    def filtered_population
      @filtered_population ||= RankingEligibilityScope.new(state: @state).relation
    end

    def categories
      @company.categories.merge(Category.active).order(:name).select do |category|
        RankingEligibilityScope.new(category_id: category.id, state: @state).relation.exists?
      end.map { |category| { id: category.id, name: category.name } }
    end

    def states
      base_population.where.not(companies: { state: [nil, ''] }).distinct.pluck(:state)
                     .map { |value| value.to_s.strip.upcase }.reject(&:blank?).uniq.sort
    end

    def sectors
      filtered_population.where.not(companies: { project_types: [] }).pluck(:project_types).flatten.compact
                         .intersection(Company::PROJECT_TYPES).sort
    end

    def cities
      return [] if @state.blank?

      filtered_population.where.not(companies: { city: [nil, ''] }).distinct.order(:city).pluck(:city)
    end
  end
end
