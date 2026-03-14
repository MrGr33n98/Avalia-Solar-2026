# frozen_string_literal: true

module CompanyDashboard
  class RankingService
    attr_reader :company, :category_id

    def initialize(company:, category_id: nil)
      @company = company
      @category_id = category_id
    end

    def ranking_data
      {
        current_position: current_position,
        total_companies: total_companies,
        percentile: percentile,
        category_rankings: category_rankings,
        magic_quadrant_competitors: competitors_for_quadrant
      }
    end

    private

    def base_scope
      scope = Company.active
      if category_id.present?
        scope = scope.joins(:categories).where(categories: { id: category_id })
      end
      scope
    end

    def current_position
      base_scope
             .where('rating_avg > ? OR (rating_avg = ? AND rating_count > ?)', 
                    company.rating_avg, company.rating_avg, company.rating_count)
             .count + 1
    end

    def total_companies
      base_scope.count
    end

    def percentile
      return 0 if total_companies.zero?
      
      ((total_companies - current_position + 1).to_f / total_companies * 100).round(1)
    end

    def competitors_for_quadrant
      # Get top 15 companies in the current scope (category or global)
      # to plot on the Magic Quadrant
      base_scope
        .order(rating_avg: :desc, rating_count: :desc)
        .limit(15)
        .map do |comp|
          {
            id: comp.id,
            name: comp.name,
            logo_url: comp.logo&.url,
            rating: comp.rating_avg.to_f,
            # X Axis: Completeness of Vision (based on reputation/trust)
            completeness_of_vision: calculate_vision_score(comp),
            # Y Axis: Ability to Execute (based on lead capacity/activity)
            ability_to_execute: calculate_execution_score(comp),
            is_current_company: comp.id == company.id
          }
        end
    end

    def calculate_vision_score(comp)
      # Normalize rating (0-5) to 0-100 scale
      ((comp.rating_avg.to_f / 5.0) * 100).round(1)
    end

    def calculate_execution_score(comp)
      # Mocked execution score based on founded year and rating count
      # In a real scenario, this would use lead response time or volume
      base = comp.rating_count.to_i > 50 ? 80 : 40
      age_bonus = comp.founded_year.to_i < 2015 ? 15 : 5
      [base + age_bonus, 100].min
    end

    def category_rankings
      company.categories.map do |category|
        position = Company.active
                          .joins(:categories)
                          .where(categories: { id: category.id })
                          .where('rating_avg > ? OR (rating_avg = ? AND rating_count > ?)', 
                                 company.rating_avg, company.rating_avg, company.rating_count)
                          .count + 1

        total = Company.active
                       .joins(:categories)
                       .where(categories: { id: category.id })
                       .count

        {
          category_id: category.id,
          category_name: category.name,
          position: position,
          total: total,
          percentile: total.zero? ? 0 : ((total - position + 1).to_f / total * 100).round(1)
        }
      end
    end
  end
end
