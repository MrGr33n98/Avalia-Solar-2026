# frozen_string_literal: true

module CompanyDashboard
  class RankingService
    attr_reader :company

    def initialize(company:)
      @company = company
    end

    def ranking_data
      {
        current_position: current_position,
        total_companies: total_companies,
        percentile: percentile,
        category_rankings: category_rankings
      }
    end

    private

    def current_position
      Company.active
             .where('rating_avg > ? OR (rating_avg = ? AND rating_count > ?)', 
                    company.rating_avg, company.rating_avg, company.rating_count)
             .count + 1
    end

    def total_companies
      Company.active.count
    end

    def percentile
      return 0 if total_companies.zero?
      
      ((total_companies - current_position + 1).to_f / total_companies * 100).round(1)
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
