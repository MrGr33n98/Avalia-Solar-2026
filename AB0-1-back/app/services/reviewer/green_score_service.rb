# frozen_string_literal: true

module Reviewer
  class GreenScoreService
    VERSION = '2026.08'
    REVIEW_POINTS = 35
    USEFUL_VOTE_POINTS = 2
    PROFILE_FIELD_POINTS = 20

    def initialize(user:)
      @user = user
    end

    def call
      reviews = @user.reviews.where(status: :approved)
      components = {
        reviews: reviews.count * REVIEW_POINTS,
        helpfulness: reviews.joins(:review_votes).where(review_votes: { vote_type: 'useful' }).count * USEFUL_VOTE_POINTS,
        profile: profile_points
      }
      { score: components.values.sum, components: components, version: VERSION, explainable: true }
    end

    private

    def profile_points
      fields = [@user.name, @user.city, @user.state]
      fields.count(&:present?) * PROFILE_FIELD_POINTS
    end
  end
end
