# frozen_string_literal: true

module Gamification
  module Rules
    class BaseRule
      attr_reader :badge

      def initialize(badge)
        @badge = badge
      end

      # Returns [eligible: Boolean, fact_at: Time | nil]
      def evaluate(user)
        raise NotImplementedError, "#{self.class} must implement #evaluate"
      end

      # Returns Integer representing current progress count towards threshold
      def progress(user)
        eligible, = evaluate(user)
        eligible ? badge.threshold : 0
      rescue StandardError
        0
      end
    end
  end
end
