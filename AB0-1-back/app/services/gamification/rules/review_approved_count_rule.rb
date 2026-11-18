# frozen_string_literal: true

module Gamification
  module Rules
    class ReviewApprovedCountRule < BaseRule
      def evaluate(user)
        approved_reviews = user.reviews.where(status: :approved)
                               .order(Arel.sql('COALESCE(approved_at, updated_at) ASC'), :id)
        count = approved_reviews.count

        if count >= badge.threshold
          target = approved_reviews.offset(badge.threshold - 1).first
          fact_at = target&.approved_at || target&.updated_at || Time.current
          [true, fact_at]
        else
          [false, nil]
        end
      end
    end
  end
end
