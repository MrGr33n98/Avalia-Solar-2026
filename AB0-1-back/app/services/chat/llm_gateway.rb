# frozen_string_literal: true

module Chat
  class LlmGateway
    DEFAULT_MODEL = 'gpt-4o-mini'
    DEFAULT_TIMEOUT = 30
    MAX_TOKENS = 800

    SYSTEM_PROMPT = <<~PROMPT
      Você é o assistente virtual do Avalia Solar, a principal plataforma de comparação e avaliação de empresas de Energia Solar e Mobilidade Elétrica do Brasil.

      Seu objetivo é ajudar consumidores e empresas a tomarem decisões melhores sobre Energia Solar e Mobilidade Elétrica.

      REGRAS OBRIGATÓRIAS:
      - Responda sempre em português brasileiro.
      - Use tom profissional, claro e objetivo.
      - Não invente preços, avaliações, empresas, garantias ou dados que não estejam no contexto fornecido.
      - Quando não souber algo, diga que precisa verificar e sugira que o usuário compare empresas na plataforma.
      - Nunca prometa economia exata sem dados suficientes.
      - Nunca dê aconselhamento jurídico, financeiro ou técnico definitivo.
      - Sempre que possível, transforme dúvidas em próximos passos práticos (comparar empresas, solicitar orçamento, etc).
      - Capture intenção comercial de forma natural e sutil.
      - Identifique se o usuário quer: energia solar, mobilidade elétrica, financiamento, manutenção, carregador, condomínio, frota ou eletroposto.
      - NUNCA peça dados pessoais diretamente. Quando perceber intenção de compra, sugira que o usuário pode receber ajuda personalizada se quiser compartilhar dados de contato.
      - Respostas devem ser MUITO curtas e conversacionais (máximo 4 a 6 linhas antes dos cards).
      - Evite listas ou bullets longos se o sistema for injetar cards de recomendação na sequência.
      - Não repita URLs ou links para o perfil da empresa se o usuário já tiver o botão "Ver Perfil" nos cards.
      - Se o contexto possuir empresas em destaque ou recomendadas, resuma a introdução: "Encontrei algumas opções ativas na sua região. Compare abaixo e solicite orçamentos."

      SOBRE A PLATAFORMA:
      - Avalia Solar permite comparar empresas de energia solar e mobilidade elétrica.
      - Usuários podem ver avaliações, solicitar orçamentos e comparar serviços.
      - A plataforma é gratuita para consumidores.
    PROMPT

    def self.call(messages:, context: nil, model: nil)
      new.call(messages: messages, context: context, model: model)
    end

    def call(messages:, context: nil, model: nil, is_fallback: false)
      api_key = ENV.fetch('AI_API_KEY', nil)
      unless api_key.present?
        Rails.logger.warn('[Chat::LlmGateway] AI_API_KEY not configured')
        return fallback_response
      end

      provider = ENV.fetch('AI_PROVIDER', 'openai').to_s.downcase
      base_url = ENV.fetch('AI_BASE_URL', provider == 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1')
      
      model_name = model || (is_fallback ? ENV.fetch('AI_FALLBACK_MODEL', DEFAULT_MODEL) : ENV.fetch('AI_MODEL', DEFAULT_MODEL))
      system_content = context.present? ? "#{SYSTEM_PROMPT}\n\nCONTEXTO ATUAL:\n#{context}" : SYSTEM_PROMPT

      payload = {
        model: model_name,
        messages: [
          { role: 'system', content: system_content },
          *messages.map { |m| { role: m[:role], content: m[:content] } }
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        top_p: 0.9
      }

      headers = {
        'Authorization' => "Bearer #{api_key}",
        'Content-Type' => 'application/json'
      }

      if provider == 'openrouter'
        referer = ENV.fetch('AI_HTTP_REFERER', 'https://www.avaliasolar.com.br')
        title = ENV.fetch('AI_APP_TITLE', 'Avalia Solar')
        headers['HTTP-Referer'] = referer if referer.present?
        headers['X-OpenRouter-Title'] = title if title.present?
      end

      start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

      response = HTTParty.post(
        "#{base_url.gsub(/\/+$/, '')}/chat/completions",
        headers: headers,
        body: payload.to_json,
        timeout: DEFAULT_TIMEOUT
      )

      latency_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).to_i

      if response.success?
        body = response.parsed_response
        choice = body.dig('choices', 0, 'message')
        content = choice&.dig('content')
        usage = body['usage'] || {}

        if content.blank?
          Rails.logger.error("[Chat::LlmGateway] Empty response content from API")
          return try_fallback(messages: messages, context: context, is_fallback: is_fallback, latency_ms: latency_ms)
        end

        {
          content: content,
          model: body['model'] || model_name,
          token_count: usage['total_tokens'] || 0,
          latency_ms: latency_ms,
          success: true
        }
      else
        handle_error_response(response, latency_ms)
        try_fallback(messages: messages, context: context, is_fallback: is_fallback, latency_ms: latency_ms)
      end
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error("[Chat::LlmGateway] Timeout: #{e.message}")
      try_fallback(messages: messages, context: context, is_fallback: is_fallback)
    rescue StandardError => e
      Rails.logger.error("[Chat::LlmGateway] Error: #{e.class} - #{e.message}")
      try_fallback(messages: messages, context: context, is_fallback: is_fallback)
    end

    private

    def try_fallback(messages:, context:, is_fallback:, latency_ms: nil)
      fallback_model = ENV.fetch('AI_FALLBACK_MODEL', nil)
      if !is_fallback && fallback_model.present?
        Rails.logger.warn("[Chat::LlmGateway] Call failed. Retrying with fallback model: #{fallback_model}")
        return call(messages: messages, context: context, model: fallback_model, is_fallback: true)
      end
      fallback_response(latency_ms: latency_ms)
    end

    def handle_error_response(response, latency_ms)
      case response.code
      when 401
        Rails.logger.error("[Chat::LlmGateway] Auth error (401): Invalid API Key")
      when 402
        Rails.logger.error("[Chat::LlmGateway] Insufficient credits / Payment Required (402)")
      when 429
        Rails.logger.error("[Chat::LlmGateway] Rate limited by provider (429)")
      else
        Rails.logger.error("[Chat::LlmGateway] API error: #{response.code} - #{response.body}")
      end
    end

    def fallback_response(latency_ms: nil)
      {
        content: 'No momento não consegui responder automaticamente, mas posso registrar sua solicitação para que nossa equipe ajude você.',
        model: 'fallback',
        token_count: 0,
        latency_ms: latency_ms,
        success: false
      }
    end
  end
end


