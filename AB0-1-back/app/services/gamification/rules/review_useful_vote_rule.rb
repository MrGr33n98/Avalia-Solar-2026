# frozen_string_literal: true

module Gamification
  module Rules
    class ReviewUsefulVoteRule < BaseRule
      def evaluate(user)
        total_votes = user.reviews.sum(:helpful_count)
        if total_votes >= badge.threshold
          [true, user.updated_at || Time.current]
        else
          [false, nil]
        end
      end

      def progress(user)
        [user.reviews.sum(:helpful_count), badge.threshold].min
      end
    end
  end
end
