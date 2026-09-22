# frozen_string_literal: true

module CompanyDashboard
  class RankingFilterOptionsService
    CACHE_TTL = 6.hours

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

    def active_companies
      @active_companies ||= Company.active
    end

    def categories
      Rails.cache.fetch("ranking-filter-options/categories-v1/#{@company.id}", expires_in: CACHE_TTL) do
        Category.active.where(id: @company.category_ids).order(:name).pluck(:id, :name)
                .map { |id, name| { id: id, name: name } }
      end
    end

    def states
      Rails.cache.fetch('ranking-filter-options/states-v1', expires_in: CACHE_TTL) do
        active_companies.where.not(state: [nil, '']).distinct.pluck(:state)
                        .map { |value| value.to_s.strip.upcase }.reject(&:blank?).uniq.sort
      end
    end

    def sectors
      Rails.cache.fetch('ranking-filter-options/sectors-v1', expires_in: CACHE_TTL) do
        active_companies.where.not(project_types: []).pluck(:project_types).flatten.compact
                        .intersection(Company::PROJECT_TYPES).sort
      end
    end

    def cities
      return [] if @state.blank?

      active_companies.where(state: @state).where.not(city: [nil, '']).distinct.order(:city).pluck(:city)
    end
  end
end
