# frozen_string_literal: true

module CompanyDashboard
  class ReputationService
    attr_reader :company

    def initialize(company:)
      @company = company
    end

    def reputation_data
      {
        total_reviews: total_reviews,
        avg_rating: avg_rating,
        trust_score: trust_score,
        trust_components: trust_components
      }
    end

    private

    def total_reviews
      Review.where(company_id: company.id, status: :approved).count
    end

    def avg_rating
      Review.where(company_id: company.id, status: :approved)
            .average(:rating)
            .to_f
            .round(2)
    end

    def trust_score
      trust_record&.score.to_f.round(2) || 0.0
    end

    def trust_components
      return {} unless trust_record&.components

      JSON.parse(trust_record.components)
    rescue JSON::ParserError => e
      Rails.logger.error("[ReputationService] Failed to parse trust components: #{e.message}")
      {}
    end

    def trust_record
      @trust_record ||= CompanyTrustScore.find_by(company_id: company.id)
    end
  end
end
