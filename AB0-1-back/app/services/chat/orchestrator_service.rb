# frozen_string_literal: true

module Chat
  class OrchestratorService
    MAX_HISTORY_MESSAGES = 20

    def self.process(session:, user_message:)
      new(session: session).process(user_message)
    end

    def initialize(session:)
      @session = session
    end

    def process(user_message)
      # 1. Sanitize input
      safe_message = Chat::SafetyService.sanitize(user_message)
      return blocked_response if safe_message.nil?

      # 2. Save user message
      user_msg = @session.chat_messages.create!(
        role: 'user',
        content: safe_message,
        safety_status: 'clean'
      )

      # 3. Build conversation history (limited)
      history = @session.chat_messages
                        .chronological
                        .last(MAX_HISTORY_MESSAGES)
                        .map { |m| { role: m.role, content: m.content } }

      # 4. Get context from retrieval service (MVP: simple DB lookup)
      context = Chat::RetrievalService.context_for(@session)

      # 5. Call LLM
      llm_response = Chat::LlmGateway.call(
        messages: history,
        context: context
      )

      # 6. Detect intent from response
      intent = detect_intent(safe_message, llm_response[:content])

      # 7. Save assistant message
      assistant_msg = @session.chat_messages.create!(
        role: 'assistant',
        content: llm_response[:content],
        model: llm_response[:model],
        token_count: llm_response[:token_count],
        latency_ms: llm_response[:latency_ms],
        safety_status: 'clean',
        intent_detected: intent
      )

      # 8. Update session
      @session.increment_message_count!

      # 9. Track PostHog event (async, non-blocking)
      track_response_event(assistant_msg, llm_response)

      # 10. Return response
      commercial_intents = %w[solar_quote solar_financing company_recommendation ev_charger_installation condominium_charging fleet_electrification]
      should_trigger = commercial_intents.include?(intent) || @session.chat_messages.user_messages.count >= 3

      {
        message: {
          id: user_msg.id,
          role: 'user',
          content: user_msg.content,
          created_at: user_msg.created_at
        },
        response: {
          id: assistant_msg.id,
          role: 'assistant',
          content: assistant_msg.content,
          intent_detected: intent,
          created_at: assistant_msg.created_at
        },
        should_trigger_lead: should_trigger,
        session: {
          id: @session.id,
          message_count: @session.message_count
        }
      }
    end

    private

    def detect_intent(user_text, _assistant_text)
      text = user_text.downcase

      intent_patterns = {
        'solar_quote' => /(?:orçamento|cotação|preço|quanto custa|instalar.+solar|painel solar)/,
        'solar_financing' => /(?:financ|parcela|crédito solar|consórcio)/,
        'solar_maintenance' => /(?:manutenção|limpeza|garantia|inversor.+problema)/,
        'ev_charger_installation' => /(?:carregador|wallbox|tomada.+elétric|instalar.+carregador)/,
        'condominium_charging' => /(?:condomínio|prédio|estacionamento.+carregador)/,
        'fleet_electrification' => /(?:frota|empresa.+carregador|eletroposto)/,
        'company_recommendation' => /(?:recomendar|indicar|melhor empresa|qual empresa)/,
        'compare_companies' => /(?:comparar|diferença entre|qual.+melhor)/,
        'general_question' => /(?:como funciona|o que é|dúvida|pergunta)/
      }

      intent_patterns.each do |intent, pattern|
        return intent if text.match?(pattern)
      end

      nil
    end

    def blocked_response
      {
        message: {
          id: nil,
          role: 'assistant',
          content: 'Desculpe, não consegui processar sua mensagem. Poderia reformular?',
          intent_detected: nil,
          created_at: Time.current
        },
        session: {
          id: @session.id,
          message_count: @session.message_count
        }
      }
    end

    def track_response_event(msg, llm_response)
      Chat::PosthogTrackingService.track(
        event: 'chat_assistant_response_generated',
        properties: {
          session_id: @session.id,
          message_id: msg.id,
          model: llm_response[:model],
          latency_ms: llm_response[:latency_ms],
          token_count: llm_response[:token_count],
          intent_detected: msg.intent_detected,
          success: llm_response[:success],
          source_page: @session.source_page,
          vertical: @session.vertical
        }
      )
    rescue StandardError => e
      Rails.logger.warn("[Chat::Orchestrator] PostHog tracking failed: #{e.message}")
    end
  end
end
