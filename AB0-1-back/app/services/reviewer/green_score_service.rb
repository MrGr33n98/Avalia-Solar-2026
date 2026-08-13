# frozen_string_literal: true

module Reviewer
  class GreenScoreService
    def initialize(user:)
      @user = user
    end

    def call
      reviews = @user.reviews
      components = {
        reviews: reviews.count * 35,
        helpfulness: reviews.joins(:review_votes).where(review_votes: { vote_type: 'useful' }).count * 2,
        profile: profile_points
      }
      { score: components.values.sum, components: components, version: 1, explainable: true }
    end

    private

    def profile_points
      fields = [@user.name, @user.city, @user.state]
      fields.count(&:present?) * 20
    end
  end
end
