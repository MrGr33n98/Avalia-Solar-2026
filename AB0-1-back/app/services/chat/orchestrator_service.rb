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
      old_intent = detect_intent(safe_message, llm_response[:content])

      intent_enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch('MOBIVOLT_INTENT_ROUTER_ENABLED', 'false'))
      shadow_enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch('MOBIVOLT_INTENT_ROUTER_SHADOW_ENABLED', 'false'))

      if intent_enabled || shadow_enabled
        new_router_state = Chat::IntentRouterService.route(safe_message, @session)
        track_intent_router_events(new_router_state, old_intent)
      end

      if intent_enabled
        intent = new_router_state[:intent]
        should_trigger = new_router_state[:should_trigger_lead]
      else
        intent = old_intent
        commercial_intents = %w[solar_quote solar_financing company_recommendation ev_charger_installation condominium_charging fleet_electrification]
        should_trigger = commercial_intents.include?(intent) || @session.chat_messages.user_messages.count >= 3
      end

      # Recupera o payload de recomendações salvo temporariamente na sessão
      msg_metadata = {}
      if @session.metadata['last_recommendation_payload'].present?
        msg_metadata = @session.metadata['last_recommendation_payload']
        # Limpa o payload da sessão
        @session.update!(metadata: @session.metadata.except('last_recommendation_payload'))
      end

      # 7. Save assistant message
      assistant_msg = @session.chat_messages.create!(
        role: 'assistant',
        content: llm_response[:content],
        model: llm_response[:model],
        token_count: llm_response[:token_count],
        latency_ms: llm_response[:latency_ms],
        safety_status: 'clean',
        intent_detected: intent,
        metadata: msg_metadata
      )

      # 8. Update session
      @session.increment_message_count!

      # 9. Track PostHog event (async, non-blocking)
      track_response_event(assistant_msg, llm_response, context)

      # 10. Return response
      # should_trigger was already determined at step 6

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
          metadata: assistant_msg.metadata,
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

    def track_response_event(msg, llm_response, context = nil)
      # 1. Track standard response event
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

      # 2. Track specialized dynamic recommendation context events
      if context.to_s.include?("=== DYNAMIC COMPANY CONTEXT ===")
        if context.to_s.include?("NENHUMA EMPRESA ENCONTRADA")
          Chat::PosthogTrackingService.track(
            event: 'chat_company_context_empty',
            properties: {
              session_id: @session.id,
              message_id: msg.id,
              vertical: @session.vertical
            }
          )
        else
          Chat::PosthogTrackingService.track(
            event: 'chat_company_context_found',
            properties: {
              session_id: @session.id,
              message_id: msg.id,
              vertical: @session.vertical
            }
          )

          if llm_response[:success]
            Chat::PosthogTrackingService.track(
              event: 'chat_company_recommendation_shown',
              properties: {
                session_id: @session.id,
                message_id: msg.id,
                vertical: @session.vertical,
                intent_detected: msg.intent_detected
              }
            )
          end
        end
      end
    rescue StandardError => e
      Rails.logger.warn("[Chat::Orchestrator] PostHog tracking failed: #{e.message}")
    end

    def track_intent_router_events(router_state, old_intent)
      Chat::PosthogTrackingService.track(
        event: 'mobivolt_intent_router_evaluated',
        properties: {
          session_id: @session.id,
          new_intent: router_state[:intent],
          confidence_score: router_state[:confidence_score],
          vertical: router_state[:vertical],
          urgency: router_state[:urgency]
        }
      )

      # Mapeamento para divergência (heurística simples, já que nomes mudaram na refatoração)
      # Exemplo: 'solar_quote' antigo corresponde a 'lead_qualification'
      mapped_old_intent = case old_intent
                          when 'solar_quote' then 'lead_qualification'
                          when 'solar_financing' then 'financing_question'
                          when 'solar_maintenance' then 'solar_support'
                          when 'compare_companies' then 'proposal_analysis' # aproximado
                          when 'general_question' then 'fallback' # aproximado
                          else old_intent
                          end

      is_divergent = mapped_old_intent.to_s != router_state[:intent].to_s
      if is_divergent
        Chat::PosthogTrackingService.track(
          event: 'mobivolt_intent_router_divergence',
          properties: {
            session_id: @session.id,
            old_intent: old_intent,
            new_intent: router_state[:intent]
          }
        )
      end

      if router_state[:fallback_triggered]
        Chat::PosthogTrackingService.track(
          event: 'mobivolt_intent_router_fallback',
          properties: {
            session_id: @session.id
          }
        )
      end
    rescue StandardError => e
      Chat::PosthogTrackingService.track(
        event: 'mobivolt_intent_router_error',
        properties: { error_message: e.message, session_id: @session.id }
      )
    end
  end
end
