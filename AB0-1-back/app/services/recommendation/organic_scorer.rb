# frozen_string_literal: true

module Recommendation
  class OrganicScorer
    ALGORITHM_VERSION = 'v1.0'

    def self.call(company:, context:)
      new(company: company, context: context).call
    end

    def initialize(company:, context:)
      @company = company
      @context = context
    end

    def call
      breakdown = {
        geography: calculate_geography_score,
        category: calculate_category_score,
        verification: calculate_verification_score,
        rating: calculate_rating_score,
        completeness: calculate_completeness_score
      }

      total = breakdown.values.sum.round(2)

      {
        total: total,
        breakdown: breakdown,
        version: ALGORITHM_VERSION
      }
    end

    private

    attr_reader :company, :context

    def calculate_geography_score
      return 10.0 if context.national?

      if context.local?
        if company.state == context.state && company.city.to_s.strip.downcase == context.city.to_s.strip.downcase
          30.0
        elsif company.company_service_areas.any? { |sa| sa.covers?(city: context.city, state: context.state) }
          25.0
        elsif company.state == context.state
          15.0
        else
          10.0
        end
      elsif context.state_only?
        if company.state == context.state
          25.0
        else
          10.0
        end
      else
        10.0
      end
    end

    def calculate_category_score
      score = 0.0
      if context.segment.present? && company.segment == context.segment
        score += 15.0
      end
      if context.category_slug.present? && company.categories.any? { |c| c.slug == context.category_slug }
        score += 10.0
      end
      score.clamp(0.0, 25.0)
    end

    def calculate_verification_score
      company.verified? ? 15.0 : 0.0
    end

    def calculate_rating_score
      avg = company.rating_avg.to_f
      count = company.rating_count.to_i

      return 0.0 if count.zero? || avg.zero?

      base_score = (avg / 5.0) * 15.0
      volume_bonus = [Math.log10(count + 1) * 2.0, 5.0].min

      (base_score + volume_bonus).clamp(0.0, 20.0).round(2)
    end

    def calculate_completeness_score
      score = 0.0
      score += 3.0 if company.logo_url.present? || company.logo.attached?
      score += 2.0 if company.description.present?
      score += 3.0 if company.response_time_sla.present?
      score += 2.0 if company.phone.present? || company.whatsapp_number.present?
      score += 0.05 * [company.delivered_projects_score.to_i, 100].min
      score.clamp(0.0, 10.0).round(2)
    end
  end
end
