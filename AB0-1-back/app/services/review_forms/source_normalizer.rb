# frozen_string_literal: true

module ReviewForms
  class SourceNormalizer
    CANONICAL_CHANNELS = %w[link qr whatsapp email widget whatsapp_voice].freeze

    def self.call(source, allow_internal: false)
      raw = source.to_s.strip.downcase
      return raw if allow_internal && raw == 'dashboard'
      return raw if CANONICAL_CHANNELS.include?(raw)

      'link'
    end
  end
end

