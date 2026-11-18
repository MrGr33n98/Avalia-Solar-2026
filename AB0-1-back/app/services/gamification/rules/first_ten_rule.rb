# frozen_string_literal: true

module Gamification
  module Rules
    class FirstTenRule < BaseRule
      def evaluate(user)
        first_ten_ids = User.where(role: 'review').order(:created_at, :id).limit(10).pluck(:id)
        if first_ten_ids.include?(user.id)
          [true, user.created_at || Time.current]
        else
          [false, nil]
        end
      end
    end
  end
end
