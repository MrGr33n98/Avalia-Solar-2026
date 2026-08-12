# frozen_string_literal: true

module Chat
  class AiSafetyPolicy
    RESTRICTED_PATTERNS = [
      /ignore\s+(?:all\s+)?previous\s+instructions/i,
      /(?:show|reveal|print).*(?:system prompt|private data|other users?)/i,
      /(?:ignore|bypass).*(?:ranking|sponsored|policy)/i
    ].freeze

    def self.allowed?(text)
      return false unless Chat::SafetyService.safe?(text)
      RESTRICTED_PATTERNS.none? { |pattern| text.to_s.match?(pattern) }
    end
  end
end
