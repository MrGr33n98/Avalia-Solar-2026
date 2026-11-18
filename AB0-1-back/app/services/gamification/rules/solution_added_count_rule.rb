# frozen_string_literal: true

module Gamification
  module Rules
    class SolutionAddedCountRule < BaseRule
      def evaluate(user)
        solutions = user.reviewer_solutions.order(:created_at, :id)
        count = solutions.count

        if count >= badge.threshold
          target = solutions.offset(badge.threshold - 1).first
          [true, target&.created_at || Time.current]
        else
          [false, nil]
        end
      end

      def progress(user)
        [user.reviewer_solutions.count, badge.threshold].min
      end
    end
  end
end
