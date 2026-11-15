# frozen_string_literal: true

module Whatsapp
  class HybridIntentClassifier
    SUPPORTED_INTENTS = %w[
      welcome_menu
      evaluate_company
      register_company
      claim_company
      check_brand_page
      ask_plans_pricing
      human_support
      unknown
    ].freeze

    def self.call(text)
      new(text).call
    end

    def initialize(text)
      @raw_text = text.to_s.strip
      @normalized = I18n.transliterate(@raw_text).downcase.strip
    end

    def call
      return { intent: 'unknown', confidence: 0.0, slots: {} } if @raw_text.blank?

      fast_match = deterministic_match
      return fast_match if fast_match[:intent] != 'unknown'

      return llm_classify if ai_router_enabled? && @raw_text.length >= 6

      fast_match
    end

    private

    def deterministic_match
      cnpj_digits = @raw_text.gsub(/\D/, '')
      has_cnpj = cnpj_digits.length == 14

      if @normalized.match?(/\A(?:5|ajuda|atendente|humano|suporte)\b/) || @normalized.match?(/(?:falar com (?:uma? )?(?:pessoa|atendente|especialista|humano|equipe)|preciso de ajuda|atendimento humano)/)
        return { intent: 'human_support', confidence: 1.0, slots: {} }
      end

      if @normalized.match?(/\A(?:menu|oi|ola|bom dia|boa tarde|boa noite|comecar|iniciar|opcoes|ajude)\b/) && !@normalized.include?('avaliar') && !@normalized.include?('cadastrar')
        return { intent: 'welcome_menu', confidence: 1.0, slots: {} }
      end

      if @normalized.match?(/\A(?:3|reivindicar|reivindicacao|assumir perfil|ja tenho cadastro|minha empresa ja esta)\b/)
        return { intent: 'claim_company', confidence: 1.0, slots: { cnpj: has_cnpj ? cnpj_digits : nil }.compact }
      end

      if @normalized.match?(/\A(?:2|cadastrar|cadastro|novo cadastro|sou integrador|quero cadastrar)\b/) || (has_cnpj && !@normalized.include?('reivindicar') && !@normalized.include?('perfil') && !@normalized.include?('pagina'))
        return { intent: 'register_company', confidence: 1.0, slots: { cnpj: has_cnpj ? cnpj_digits : nil }.compact }
      end

      if @normalized.match?(/\A(?:4|perfil)\z/) || @normalized.match?(/(?:como minha empresa aparece|ver (?:o |meu )?perfil|pagina da (?:minha )?empresa|brand page|link da (?:minha )?empresa)/)
        query = extract_company_query(/(?:perfil\s+da\s+empresa|pagina\s+da\s+empresa|empresa|perfil\s+da|pagina\s+da)\s+(.+)\z/i)
        return {
          intent: 'check_brand_page',
          confidence: 0.95,
          slots: { cnpj: (has_cnpj ? cnpj_digits : nil), company_query: query }.compact
        }
      end

      if @normalized.match?(/(?:plano|planos|preco|precos|mensalidade|destaque|patrocinado|gerar leads|receber leads|receber orcamentos|como funciona o pago)/)
        return { intent: 'ask_plans_pricing', confidence: 0.95, slots: {} }
      end

      if @normalized.match?(/\A(?:1)\z/) || @normalized.match?(/(?:quero avaliar|gostaria de avaliar|avaliar (?:a |uma )?empresa|deixar (?:uma )?avaliacao|fazer (?:uma )?avaliacao)/)
        query = extract_company_query(/(?:avaliar(?:\s+a|\s+empresa)?)\s+([a-z0-9\s\-&.]{3,60})\z/i)
        return {
          intent: 'evaluate_company',
          confidence: 0.95,
          slots: { company_query: query }.compact
        }
      end

      { intent: 'unknown', confidence: 0.3, slots: {} }
    end

    def extract_company_query(regex)
      match = @raw_text.match(regex)
      candidate = match&.captures&.last.to_s.strip
      return nil if candidate.blank? || candidate.match?(/\A(?:uma|a|minha|empresa|no avalia solar)\z/i)

      candidate
    end

    def ai_router_enabled?
      ActiveModel::Type::Boolean.new.cast(ENV.fetch('WHATSAPP_AI_ROUTER_ENABLED', 'false'))
    end

    def llm_classify
      sanitized = defined?(Chat::AiSafetyPolicy) ? Chat::AiSafetyPolicy.sanitize_user_input(@raw_text) : @raw_text.truncate(300)
      prompt = <<~PROMPT
        Classifique a mensagem de WhatsApp enviada ao portal Avalia Solar em uma única intenção JSON.
        Intenções permitidas: #{SUPPORTED_INTENTS.join(', ')}.
        Responda APENAS JSON válido no formato:
        {"intent":"...","confidence":0.9,"slots":{"company_query":null,"cnpj":null}}
        Mensagem: #{sanitized}
      PROMPT

      raw_response = if defined?(Chat::CircuitBreaker) && defined?(OpenRouterClient)
                       Chat::CircuitBreaker.run('whatsapp_intent_llm', timeout: 4) do
                         OpenRouterClient.new.chat(prompt)
                       end
                     end
      parsed = JSON.parse(raw_response.to_s[/\{.*\}/m].to_s)
      intent = SUPPORTED_INTENTS.include?(parsed['intent']) ? parsed['intent'] : 'unknown'
      {
        intent: intent,
        confidence: parsed['confidence'].to_f,
        slots: (parsed['slots'].is_a?(Hash) ? parsed['slots'].symbolize_keys.compact : {})
      }
    rescue StandardError => e
      Rails.logger.warn("[Whatsapp::HybridIntentClassifier] LLM fallback to deterministic: #{e.class} - #{e.message}")
      { intent: 'unknown', confidence: 0.2, slots: {} }
    end
  end
end
