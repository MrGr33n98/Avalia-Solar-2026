# frozen_string_literal: true

module TrustScore
  class CalculationService
    # Score components and their weights
    WEIGHTS = {
      base: 50,
      verification: 20,
      rating: 20,
      reviews: 10,
      engagement: 10,
      leads: 10
    }.freeze

    # Maximum values for each component (used for normalization)
    MAX_VALUES = {
      rating: 5.0,           # Max rating is 5 stars
      reviews: 100,          # Capped at 100 reviews for scoring
      engagement: 500,      # Capped at 500 profile views
      leads: 100             # Capped at 100 leads
    }.freeze

    attr_reader :company

    def initialize(company)
      @company = company
    end

    # Calculate trust score and return hash with score and components
    # @return [Hash] { score: Integer, components: Hash, previous_score: Integer, score_changed: Boolean }
    def calculate!
      components = calculate_components
      score = normalize_score(calculate_total(components))
      previous_score = fetch_previous_score

      {
        score: score,
        components: components,
        previous_score: previous_score,
        score_changed: previous_score.nil? || (score - previous_score).abs > 0
      }
    end

    # Calculate trust score from stored record (for real-time queries)
    # @return [Integer] The stored trust score
    def self.fetch_stored(company_id)
      record = CompanyTrustScore.find_by(company_id: company_id)
      record&.score&.to_i || 0
    end

    # Calculate trust score inline (for widgets when stored value is stale)
    # @return [Integer] The calculated trust score
    def self.calculate_inline(company)
      new(company).calculate![:score]
    end

    private

    def calculate_components
      {
        base: WEIGHTS[:base],
        verification: calculate_verification_component,
        rating: calculate_rating_component,
        reviews: calculate_reviews_component,
        engagement: calculate_engagement_component,
        leads: calculate_leads_component,
        penalty: calculate_penalty
      }
    end

    def calculate_total(components)
      total = components.values.sum
      # Cap at 100, floor at 0
      total.clamp(0, 100)
    end

    def normalize_score(score)
      score.round.clamp(0, 100)
    end

    # Verification component: +20 if verified, +0 if not
    def calculate_verification_component
      company.verified? ? WEIGHTS[:verification] : 0
    end

    # Rating component: (rating / max_rating) * max_weight
    # Example: 4.5 stars = (4.5/5) * 20 = 18 points
    def calculate_rating_component
      return 0 unless company.rating_avg.present? && company.rating_avg > 0

      normalized = (company.rating_avg.to_f / MAX_VALUES[:rating]) * WEIGHTS[:rating]
      normalized.round(1)
    end

    # Reviews component: min((reviews / max_reviews) * max_weight, max_weight)
    # Example: 50 reviews = min((50/100) * 10, 10) = 5 points
    def calculate_reviews_component
      count = company.reviews.approved.count
      return 0 if count.zero?

      raw = (count.to_f / MAX_VALUES[:reviews]) * WEIGHTS[:reviews]
      [raw, WEIGHTS[:reviews]].min.round(1)
    end

    # Engagement component: based on profile views and CTA clicks
    # Using log scale for better distribution
    def calculate_engagement_component
      # For now, return 0 or fetch from a reliable source if available
      # We'll use a safe check for the column to avoid boot errors
      engagement = 0
      if company.respond_to?(:profile_views_count)
        engagement = company.profile_views_count.to_i + (company.respond_to?(:cta_clicks_count) ? company.cta_clicks_count.to_i * 2 : 0)
      end
      
      return 0 if engagement.zero?

      # Logarithmic scaling: log(1 + x) / log(1 + max) * weight
      raw = Math.log1p(engagement) / Math.log1p(MAX_VALUES[:engagement]) * WEIGHTS[:engagement]
      [raw, WEIGHTS[:engagement]].min.round(1)
    end

    # Leads component: based on lead volume
    def calculate_leads_component
      count = company.leads.count
      return 0 if count.zero?

      raw = (count.to_f / MAX_VALUES[:leads]) * WEIGHTS[:leads]
      [raw, WEIGHTS[:leads]].min.round(1)
    end

    # Penalty component: negative values for anomalies
    # This would query the anomaly table in production
    def calculate_penalty
      # For now, return 0 - could be enhanced with anomaly detection
      0
    end

    def fetch_previous_score
      record = CompanyTrustScore.find_by(company_id: company.id)
      record&.score&.to_i
    end
  end
end
