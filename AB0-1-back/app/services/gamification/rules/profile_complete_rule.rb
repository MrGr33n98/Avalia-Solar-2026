# frozen_string_literal: true

module Gamification
  module Rules
    class ProfileCompleteRule < BaseRule
      def evaluate(user)
        essential_fields = [user.name, user.email, user.phone, user.city, user.state]
        is_complete = essential_fields.all?(&:present?)
        [is_complete, is_complete ? (user.updated_at || Time.current) : nil]
      end
    end
  end
end
