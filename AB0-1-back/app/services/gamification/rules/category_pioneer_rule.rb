# frozen_string_literal: true

module Gamification
  module Rules
    class CategoryPioneerRule < BaseRule
      def evaluate(user)
        pioneer_review = user.reviews.where(status: :approved).detect do |rev|
          earliest = Review.where(company_id: rev.company_id, status: :approved)
                           .order(Arel.sql('COALESCE(approved_at, updated_at) ASC'), :id)
                           .first
          earliest&.id == rev.id
        end

        if pioneer_review
          fact_at = pioneer_review.approved_at || pioneer_review.updated_at || Time.current
          [true, fact_at]
        else
          [false, nil]
        end
      end
    end
  end
end
