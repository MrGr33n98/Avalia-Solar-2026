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
      # Vision is market perception (Trust + Rating)
      # (Rating Avg * 0.7 + Verified Bonus * 0.3)
      rating_normalized = (comp.rating_avg.to_f / 5.0) * 80
      verified_bonus = comp.verified ? 20 : 0
      (rating_normalized + verified_bonus).round(1)
    end

    def calculate_execution_score(comp)
      # Ability to execute is commercial performance
      # Leads (weighted) + Clicks + Profile views
      lead_score = [comp.leads_count.to_i * 5, 50].min
      click_score = [comp.cta_clicks_count.to_i, 30].min
      view_score = [comp.profile_views_count.to_i / 10, 20].min
      
      (lead_score + click_score + view_score).round(1)
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
