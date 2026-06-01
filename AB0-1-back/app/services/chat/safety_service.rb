# frozen_string_literal: true

module Chat
  class SafetyService
    MAX_MESSAGE_LENGTH = 2000
    BLOCKED_PATTERNS = [
      /\b(?:drop\s+table|delete\s+from|insert\s+into)\b/i,
      /(?:<script|javascript:|on\w+\s*=)/i
    ].freeze

    def self.sanitize(text)
      return nil if text.blank?

      # Trim
      cleaned = text.strip

      # Length limit
      return nil if cleaned.length > MAX_MESSAGE_LENGTH

      # Strip HTML
      cleaned = ActionController::Base.helpers.strip_tags(cleaned)

      # Check blocked patterns
      BLOCKED_PATTERNS.each do |pattern|
        if cleaned.match?(pattern)
          Rails.logger.warn("[Chat::SafetyService] Blocked message matching pattern: #{pattern.source}")
          return nil
        end
      end

      cleaned.presence
    end

    def self.safe?(text)
      sanitize(text).present?
    end
  end
end
