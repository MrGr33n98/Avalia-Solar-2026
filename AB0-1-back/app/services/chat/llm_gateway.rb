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
      - Respostas curtas e diretas (máximo 3 parágrafos).

      SOBRE A PLATAFORMA:
      - Avalia Solar permite comparar empresas de energia solar e mobilidade elétrica.
      - Usuários podem ver avaliações, solicitar orçamentos e comparar serviços.
      - A plataforma é gratuita para consumidores.
    PROMPT

    def self.call(messages:, context: nil, model: nil)
      new.call(messages: messages, context: context, model: model)
    end

    def call(messages:, context: nil, model: nil)
      api_key = ENV.fetch('AI_API_KEY', nil)
      unless api_key.present?
        Rails.logger.warn('[Chat::LlmGateway] AI_API_KEY not configured')
        return fallback_response
      end

      model_name = model || ENV.fetch('AI_MODEL', DEFAULT_MODEL)
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

      start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

      response = HTTParty.post(
        'https://api.openai.com/v1/chat/completions',
        headers: {
          'Authorization' => "Bearer #{api_key}",
          'Content-Type' => 'application/json'
        },
        body: payload.to_json,
        timeout: DEFAULT_TIMEOUT
      )

      latency_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).to_i

      if response.success?
        body = response.parsed_response
        choice = body.dig('choices', 0, 'message')
        usage = body['usage'] || {}

        {
          content: choice&.dig('content') || 'Desculpe, não consegui processar sua mensagem.',
          model: body['model'],
          token_count: usage['total_tokens'],
          latency_ms: latency_ms,
          success: true
        }
      else
        Rails.logger.error("[Chat::LlmGateway] API error: #{response.code} - #{response.body}")
        fallback_response(latency_ms: latency_ms)
      end
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error("[Chat::LlmGateway] Timeout: #{e.message}")
      fallback_response
    rescue StandardError => e
      Rails.logger.error("[Chat::LlmGateway] Error: #{e.class} - #{e.message}")
      fallback_response
    end

    private

    def fallback_response(latency_ms: nil)
      {
        content: 'Desculpe, estou com dificuldade para processar sua mensagem agora. ' \
                 'Enquanto isso, você pode comparar empresas de energia solar diretamente na nossa plataforma ' \
                 'ou solicitar um orçamento gratuito. Posso ajudar com outra coisa?',
        model: 'fallback',
        token_count: 0,
        latency_ms: latency_ms,
        success: false
      }
    end
  end
end
