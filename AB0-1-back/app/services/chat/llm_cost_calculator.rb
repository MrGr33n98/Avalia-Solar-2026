# frozen_string_literal: true

module Chat
  class LlmCostCalculator
    DEFAULTS = { input: 0.15, output: 0.60 }.freeze

    def self.call(provider:, model:, input_tokens:, output_tokens:)
      rates = JSON.parse(ENV.fetch('CHAT_LLM_PRICING_JSON', '{}')).dig(provider.to_s, model.to_s) || DEFAULTS
      ((input_tokens.to_i * rates.fetch('input', DEFAULTS[:input]) + output_tokens.to_i * rates.fetch('output', DEFAULTS[:output])) / 1_000_000.0).round(8)
    rescue JSON::ParserError, TypeError
      ((input_tokens.to_i * DEFAULTS[:input] + output_tokens.to_i * DEFAULTS[:output]) / 1_000_000.0).round(8)
    end
  end
end
