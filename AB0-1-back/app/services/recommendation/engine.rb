# frozen_string_literal: true

module Recommendation
  class Engine
    DEFAULT_LIMIT = 8
    MAX_SPONSORED_SLOTS = 2

    def self.call(context:, limit: DEFAULT_LIMIT)
      new(context: context, limit: limit).call
    end

    def initialize(context:, limit: DEFAULT_LIMIT)
      @context = context
      @limit = [limit.to_i, 1].max
    end

    def call
      # 1. Fetch eligible population
      eligible_companies = EligibilityQuery.call(context: context)
      return [] if eligible_companies.empty?

      eligible_ids = eligible_companies.map(&:id)

      # 2. Score organic population
      scored_items = eligible_companies.map do |company|
        score_data = OrganicScorer.call(company: company, context: context)
        { company: company, score_data: score_data }
      end.sort_by { |item| -item[:score_data][:total] }

      # 3. Fetch placements
      placements = PlacementResolver.call(context: context, eligible_company_ids: eligible_ids)
      sponsored_placements = placements[:sponsored]

      # 4. Slot resolution: Combine sponsored & organic
      final_results = []
      used_company_ids = Set.new

      # Insert sponsored placements into top slots (up to MAX_SPONSORED_SLOTS)
      sponsored_placements.take(MAX_SPONSORED_SLOTS).each do |placement|
        company = placement.company
        next if used_company_ids.include?(company.id)

        used_company_ids.add(company.id)
        ctas = CtaResolver.call(company)
        reason = ReasonResolver.call(company: company, context: context, is_sponsored: true)

        organic_score_data = OrganicScorer.call(company: company, context: context)

        final_results << Result.new(
          company: company,
          organic_score: organic_score_data[:total],
          final_position: final_results.size + 1,
          recommendation_reason: reason,
          sponsored: true,
          placement: placement,
          primary_cta: ctas[:primary],
          secondary_cta: ctas[:secondary],
          comparison_group: company.segment,
          score_breakdown: organic_score_data[:breakdown]
        )
      end

      # Fill remaining slots with organic scoring results
      scored_items.each do |item|
        break if final_results.size >= limit

        company = item[:company]
        next if used_company_ids.include?(company.id)

        used_company_ids.add(company.id)
        ctas = CtaResolver.call(company)
        reason = ReasonResolver.call(company: company, context: context, is_sponsored: false)

        final_results << Result.new(
          company: company,
          organic_score: item[:score_data][:total],
          final_position: final_results.size + 1,
          recommendation_reason: reason,
          sponsored: false,
          placement: nil,
          primary_cta: ctas[:primary],
          secondary_cta: ctas[:secondary],
          comparison_group: company.segment,
          score_breakdown: item[:score_data][:breakdown]
        )
      end

      final_results
    end

    private

    attr_reader :context, :limit
  end
end
