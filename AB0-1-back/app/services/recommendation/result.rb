# frozen_string_literal: true

module Recommendation
  class Result
    attr_reader :company, :organic_score, :final_position, :recommendation_reason,
                :sponsored, :placement, :primary_cta, :secondary_cta,
                :comparison_group, :score_breakdown

    def initialize(
      company:,
      organic_score: 0.0,
      final_position: 1,
      recommendation_reason: {},
      sponsored: false,
      placement: nil,
      primary_cta: {},
      secondary_cta: {},
      comparison_group: 'default',
      score_breakdown: {}
    )
      @company = company
      @organic_score = organic_score.to_f
      @final_position = final_position.to_i
      @recommendation_reason = recommendation_reason
      @sponsored = sponsored
      @placement = placement
      @primary_cta = primary_cta
      @secondary_cta = secondary_cta
      @comparison_group = comparison_group.presence || company.segment.presence || 'installers'
      @score_breakdown = score_breakdown
      freeze
    end

    def sponsored?
      sponsored
    end
  end
end
