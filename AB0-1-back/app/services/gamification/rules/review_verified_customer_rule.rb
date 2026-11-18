# frozen_string_literal: true

module Gamification
  module Rules
    class ReviewVerifiedCustomerRule < BaseRule
      def evaluate(user)
        verified_review = user.reviews.where(status: :approved)
                              .where("verification_status = 'manually_verified' OR verified = true")
                              .order(Arel.sql('COALESCE(approved_at, updated_at) ASC'), :id)
                              .first

        if verified_review
          fact_at = verified_review.approved_at || verified_review.updated_at || Time.current
          [true, fact_at]
        else
          [false, nil]
        end
      end
    end
  end
end
