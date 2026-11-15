# frozen_string_literal: true

module Whatsapp
  # Deliberately deterministic: a consumer review or arbitrary chat must not
  # be reclassified as an internal sales lead based on an LLM guess.
  class CrmSignalClassifier
    INTENTS = %w[pricing_requested human_requested registration_started company_claim_requested].freeze

    def self.call(text)
      normalized = I18n.transliterate(text.to_s).downcase.squish
      return nil if normalized.blank?

      if normalized.match?(/\b(?:ajuda|atendente|humano|suporte|falar com (?:uma? )?(?:pessoa|equipe|especialista))\b/)
        'human_requested'
      elsif normalized.match?(/\b(?:reivindicar|reivindicacao|assumir perfil)\b/)
        'company_claim_requested'
      elsif normalized.match?(/\b(?:cadastrar|cadastro|sou integrador|quero registrar minha empresa)\b/)
        'registration_started'
      elsif normalized.match?(/\b(?:planos?|precos?|mensalidade|enterprise|plano pro|quanto custa|patrocinado)\b/)
        'pricing_requested'
      end
    end
  end
end
