# frozen_string_literal: true

module Chat
  class IntentRouterService
    # Intents oficiais mapeadas
    INTENTS = %w[
      greeting
      solar_support
      solar_assessment
      company_recommendation
      lead_qualification
      financing_question
      ev_charger_question
      proposal_analysis
      feedback
      fallback
    ].freeze

    def self.route(user_message, session = nil)
      new(user_message, session).route
    end

    def initialize(user_message, session)
      @text = user_message.to_s.downcase
      @session = session
    end

    def route
      intent, score = detect_intent
      urgency = detect_urgency
      location = extract_location

      trigger_lead = should_trigger_lead?(intent, urgency)
      next_agent = intent == 'company_recommendation' ? 'company_recommendation' : intent

      {
        intent: intent,
        confidence_score: score,
        vertical: detect_vertical(intent),
        location: location,
        urgency: urgency,
        next_agent: next_agent,
        should_trigger_lead: trigger_lead,
        fallback_triggered: intent == 'fallback'
      }
    rescue StandardError => e
      Rails.logger.error("[Chat::IntentRouterService] Failed to route: #{e.message}")
      fallback_response
    end

    private

    def fallback_response
      {
        intent: 'fallback',
        confidence_score: 0.0,
        vertical: nil,
        location: {},
        urgency: 'normal',
        next_agent: 'fallback',
        should_trigger_lead: false,
        fallback_triggered: true
      }
    end

    def detect_intent
      patterns = {
        'proposal_analysis' => /(?:analisar proposta|comparar orçamento|recebi um orçamento|esta proposta)/,
        'company_recommendation' => /(?:recomendar|indic(?:ar|a)|melhor empresa|qual empresa|onde encontro|instalador)/,
        'lead_qualification' => /(?:orçamento|cotação|contratar|quero instalar|preciso instalar|gostaria de instalar|instalação)/,
        'ev_charger_question' => %r{(?:carregador|wallbox|tomada.+elétric|carro elétrico|veículo elétrico|condomínio.+carregador|frota|recarga\s+(?:ac|dc)|ac\s*(?:/|e|vs\.?)\s*dc)},
        'financing_question' => /(?:financ|parcela|crédito solar|consórcio|banco|taxa de juros)/,
        'solar_support' => /(?:manutenção|limpeza|garantia|inversor.+problema|quebrou|parou de funcionar|microinversor|energia injetada|créditos? de energia|bateria solar|carport solar)/,
        'solar_assessment' => /(?:vale a pena|gera quanto|simulação|tamanho do sistema|quantas placas|potência)/,
        'feedback' => /(?:sugestão|reclamação|feedback|melhorar)/,
        'greeting' => /^(?:oi|olá|bom dia|boa tarde|boa noite|tudo bem|ola)\b/
      }

      patterns.each do |intent_name, regex|
        return [intent_name, 0.8] if @text.match?(regex)
      end

      ['fallback', 0.1]
    end

    def detect_urgency
      if @text.match?(/(?:urgente|rápido|pra ontem|emergência|agora)/)
        'high'
      else
        'normal'
      end
    end

    def extract_location
      location = {}

      # Heurística extremamente básica de exemplo, expansível por LLM depois
      if (match = @text.match(/em (são paulo|rio de janeiro|belo horizonte|curitiba|brasília|campinas|salvador|fortaleza|recife|porto alegre)/))
        location[:city] = match[1].split.map(&:capitalize).join(' ')
      end

      # UF regex
      states = %w[AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO]
      location[:state] = @text.scan(/\b[a-z]{2}\b/i).map(&:upcase).find { |token| states.include?(token) }

      location
    end

    def detect_vertical(intent)
      if intent == 'ev_charger_question'
        'electric_mobility'
      elsif intent != 'greeting' && intent != 'feedback' && intent != 'fallback'
        'solar'
      end
    end

    def should_trigger_lead?(intent, urgency)
      case intent
      when 'lead_qualification'
        true
      when 'company_recommendation'
        # Recommendation triggers lead if urgency is high or if explicitly requesting a quote is in text
        urgency == 'high' || @text.match?(/(?:orçamento|cotação|preço)/)
      else
        false
      end
    end
  end
end
