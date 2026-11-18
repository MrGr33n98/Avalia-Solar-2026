# frozen_string_literal: true

module Gamification
  module Rules
    class AnswerPublishedRule < BaseRule
      def evaluate(user)
        first_answer = ForumAnswer.where(user_id: user.id).order(:created_at, :id).first
        if first_answer
          [true, first_answer.created_at || Time.current]
        else
          [false, nil]
        end
      end
    end
  end
end
