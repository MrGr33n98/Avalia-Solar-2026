# frozen_string_literal: true

module Sales
  module Messaging
    class OpenSignalClassifier
      RULES = [
        [/GoogleImageProxy/i, 'proxy', 'google_image_proxy'],
        [/AppleMessageFrame/i, 'proxy', 'apple_mail_privacy'],
        [/(security|safelinks|urlscan|proofpoint|mimecast|barracuda|sophos)/i, 'scanner', 'security_scanner'],
        [/(bot|crawler|spider)/i, 'bot', 'known_bot']
      ].freeze

      def self.call(user_agent)
        rule = RULES.find { |pattern, _classification, _reason| user_agent.to_s.match?(pattern) }
        return { signal_class: 'unknown', reasons: ['unknown_client'] } unless rule

        { signal_class: rule[1], reasons: [rule[2]] }
      end
    end
  end
end
