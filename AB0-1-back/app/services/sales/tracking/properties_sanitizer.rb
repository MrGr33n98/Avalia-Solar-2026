# frozen_string_literal: true

module Sales
  module Tracking
    class PropertiesSanitizer
      BLOCKED_KEYS = /email|phone|name|token|password|secret|authorization/i
      SAFE_KEY = /\A[a-zA-Z0-9_.-]{1,80}\z/

      def self.call(value)
        return {} unless value.is_a?(ActionController::Parameters) || value.is_a?(Hash)

        raw = value.is_a?(ActionController::Parameters) ? value.to_unsafe_h : value
        raw.first(30).each_with_object({}) do |(key, item), safe|
          safe[key.to_s] = normalized_value(item) if allowed?(key, item)
        end
      end

      def self.allowed?(key, item)
        key.to_s.match?(SAFE_KEY) && !key.to_s.match?(BLOCKED_KEYS) && scalar?(item)
      end
      private_class_method :allowed?

      def self.scalar?(value)
        value.is_a?(String) || value.is_a?(Numeric) || [true, false].include?(value)
      end
      private_class_method :scalar?

      def self.normalized_value(value)
        value.is_a?(String) ? value.first(500) : value
      end
      private_class_method :normalized_value
    end
  end
end
