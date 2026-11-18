# frozen_string_literal: true

module Gamification
  module Rules
    class SolarPlantCompleteRule < BaseRule
      def evaluate(user)
        complete_review = user.reviews.where(status: :approved, installation_status: :completed)
                              .order(Arel.sql('COALESCE(approved_at, updated_at) ASC'), :id)
                              .first

        if complete_review
          fact_at = complete_review.approved_at || complete_review.updated_at || Time.current
          [true, fact_at]
        else
          [false, nil]
        end
      end
    end
  end
end
