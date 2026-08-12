# frozen_string_literal: true

module Chat
  class OrchestratorService
    MAX_HISTORY_MESSAGES = 20

    def self.process(session:, user_message:, &block)
      new(session: session).process(user_message, &block)
    end

    def initialize(session:)
      @session = session
    end

    def process(user_message, &)
      # 1. Sanitize input
      safe_message = Chat::SafetyService.sanitize(user_message)
      return blocked_response if safe_message.nil?

      # 2. Save user message
      user_msg = @session.chat_messages.create!(
        role: 'user',
        content: safe_message,
        safety_status: 'clean'
      )

      register_customer_message(user_msg)

      unless @session.bot_may_respond?
        @session.increment_message_count!
        final_metadata = {
          message: message_metadata(user_msg),
          response: nil,
          awaiting_agent: true,
          should_trigger_lead: false,
          session: {
            id: @session.id,
            message_count: @session.message_count,
            mode: @session.mode,
            inbox_status: @session.inbox_status
          }
        }

        return final_metadata unless block_given?

        yield('', true, final_metadata)
        return
      end

      # 3. Build conversation history (limited)
      history = @session.chat_messages
                        .chronological
                        .last(MAX_HISTORY_MESSAGES)
                        .map { |m| { role: m.role, content: m.content } }

      # 4. Get context from retrieval service (MVP: simple DB lookup)
      retrieval_started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      context = Chat::RetrievalService.context_for(@session)
      retrieval_time_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - retrieval_started_at) * 1000).round

      # 4.5. Se for o assistente Success do Dashboard, desvia do fluxo de leads
      if @session.vertical == 'success'
        system_prompt = Chat::LlmGateway::SUCCESS_SYSTEM_PROMPT

        llm_response = Chat::LlmGateway.call(
          messages: history,
          context: context,
          system_prompt: system_prompt,
          &
        )

        assistant_msg = @session.chat_messages.create!(
          role: 'assistant',
          content: llm_response[:content],
          model: llm_response[:model],
          token_count: llm_response[:token_count],
          latency_ms: llm_response[:latency_ms],
          retrieval_time_ms: retrieval_time_ms,
          ttft_ms: llm_response[:ttft_ms],
          full_response_time_ms: llm_response[:latency_ms],
          safety_status: 'clean',
          intent_detected: 'success_onboarding',
          metadata: Chat::SourceProvenance.normalize(success_response_metadata)
        )

        @session.increment_message_count!

        begin
          Chat::PosthogTrackingService.track(
            event: 'chat_success_response_generated',
            properties: {
              session_id: @session.id,
              message_id: assistant_msg.id,
              model: llm_response[:model],
              success: llm_response[:success]
            }
          )
        rescue StandardError
          nil
        end

        final_metadata = {
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
            intent_detected: 'success_onboarding',
            metadata: assistant_msg.metadata,
            created_at: assistant_msg.created_at
          },
          should_trigger_lead: false,
          session: {
            id: @session.id,
            message_count: @session.message_count
          }
        }

        return final_metadata unless block_given?

        yield('', true, final_metadata)



        return
      end

      # 5. Intent Router
      old_intent = detect_intent(safe_message, '') # Mocking llm response
      intent_enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch('MOBIVOLT_INTENT_ROUTER_ENABLED', 'false'))
      shadow_enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch('MOBIVOLT_INTENT_ROUTER_SHADOW_ENABLED', 'false'))
      agents_enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch('MOBIVOLT_AGENTS_ENABLED', 'false'))

      if intent_enabled || shadow_enabled || agents_enabled
        new_router_state = Chat::IntentRouterService.route(safe_message, @session)
        track_intent_router_events(new_router_state, old_intent)
      else
        new_router_state = { intent: old_intent, should_trigger_lead: false, next_agent: nil }
      end

      # 6. Agentes ou Legacy
      support_intents = %w[solar_support financing_question ev_charger_question solar_assessment]

      if agents_enabled && new_router_state[:next_agent] == 'company_recommendation'
        agent_result = Chat::Agents::CompanyRecommendationAgent.process(
          session: @session,
          user_message: safe_message,
          router_state: new_router_state,
          context: context
        )

        intent = agent_result[:intent]
        llm_content = agent_result[:content]
        msg_metadata = agent_result[:metadata]
        llm_model = 'mobivolt-agent'
        llm_token_count = 0
        llm_latency_ms = 0
        llm_success = agent_result[:success]

        llm_response = {
          content: llm_content,
          model: llm_model,
          token_count: llm_token_count,
          latency_ms: llm_latency_ms,
          success: llm_success
        }

        # PostHog Agent Tracking
        Chat::PosthogTrackingService.track(event: 'mobivolt_agent_invoked',
                                           properties: {
                                             session_id: @session.id, agent: 'company_recommendation'
                                           })
        if agent_result[:fallback_triggered]
          Chat::PosthogTrackingService.track(event: 'mobivolt_agent_fallback',
                                             properties: {
                                               session_id: @session.id, agent: 'company_recommendation'
                                             })
        end
        if msg_metadata['companies'] && msg_metadata['companies'].empty?
          Chat::PosthogTrackingService.track(event: 'mobivolt_company_recommendation_empty',
                                             properties: { session_id: @session.id })
        else
          Chat::PosthogTrackingService.track(event: 'mobivolt_company_recommendation_success',
                                             properties: { session_id: @session.id })
        end

      elsif agents_enabled && support_intents.include?(new_router_state[:next_agent])
        agent_result = Chat::Agents::SupportAgent.process(
          session: @session,
          user_message: safe_message,
          router_state: new_router_state,
          context: context
        )

        intent = agent_result[:intent]
        llm_content = agent_result[:content]
        msg_metadata = agent_result[:metadata]
        llm_model = 'mobivolt-agent-support'
        llm_token_count = 0
        llm_latency_ms = 0
        llm_success = agent_result[:success]

        llm_response = {
          content: llm_content,
          model: llm_model,
          token_count: llm_token_count,
          latency_ms: llm_latency_ms,
          success: llm_success
        }

        # PostHog Agent Tracking
        Chat::PosthogTrackingService.track(event: 'mobivolt_agent_invoked',
                                           properties: {
                                             session_id: @session.id, agent: 'support'
                                           })
        if agent_result[:fallback_triggered]
          Chat::PosthogTrackingService.track(event: 'mobivolt_agent_fallback',
                                             properties: {
                                               session_id: @session.id, agent: 'support'
                                             })
        end

      else
        # Fluxo Clássico (LlmGateway)
        llm_response = Chat::LlmGateway.call(messages: history, context: context, &)
        llm_content = llm_response[:content]
        llm_model = llm_response[:model]
        llm_token_count = llm_response[:token_count]
        llm_latency_ms = llm_response[:latency_ms]
        llm_response[:success]
        agent_result = nil

        intent = if intent_enabled
                   new_router_state[:intent]
                 else
                   old_intent
                 end

        msg_metadata = {}
        if @session.metadata['last_recommendation_payload'].present?
          msg_metadata = @session.metadata['last_recommendation_payload']
        end
      end

      # 6.5 Qualificação de Lead (Middleware)
      if agents_enabled
        qualifier_result = Chat::Agents::LeadQualifierAgent.process(
          session: @session,
          user_message: safe_message,
          router_state: new_router_state,
          context: context,
          agent_result: agent_result
        )
        if agent_result&.dig(:metadata, 'type') == 'support_answer' && agent_result[:should_trigger_lead] == false
          qualifier_result = qualifier_result.merge(
            should_trigger_lead: false,
            lead_reason: 'support_answer_informative'
          )
        end
        should_trigger = qualifier_result[:should_trigger_lead]

        # 6.6 CRM Handoff (Middleware)
        handoff_result = Chat::Agents::CRMHandoffAgent.process(
          session: @session,
          user_message: safe_message,
          router_state: new_router_state,
          lead_qualification_result: qualifier_result,
          agent_result: agent_result,
          context: context
        )

        msg_metadata ||= {}
        msg_metadata.merge!({
                              'lead_score' => qualifier_result[:lead_score],
                              'lead_temperature' => qualifier_result[:lead_temperature],
                              'handoff_status' => handoff_result[:lead_status],
                              'handoff_triggered' => handoff_result[:handoff_triggered],
                              'duplicate_prevented' => handoff_result[:duplicate_prevented]
                            })
                            
        if (handoff_result[:handoff_triggered] || handoff_result[:lead_status] == 'pending_contact_info' || @session.waiting_for_agent?) && @session.metadata['summary_card'].blank?
          generate_summary_card(history)
        end
      else
        # Fallback para Lógica Legada de Qualificação
        commercial_intents = %w[solar_quote solar_financing company_recommendation ev_charger_installation
                                condominium_charging fleet_electrification lead_qualification proposal_analysis]
        technical_intents = %w[solar_support solar_assessment financing_question ev_charger_question solar_maintenance]
        should_trigger = commercial_intents.include?(intent) ||
                         (!technical_intents.include?(intent) && @session.chat_messages.user_messages.count >= 3)
      end

      # 6.5 Cleanup incondicional de payload obsoleto na sessão (evita memory leak no DB)
      if @session.metadata['last_recommendation_payload'].present?
        @session.update!(metadata: @session.metadata.except('last_recommendation_payload'))
      end

      # 7. Save assistant message
      assistant_msg = @session.chat_messages.create!(
        role: 'assistant',
        content: llm_content,
        model: llm_model,
        token_count: llm_token_count,
        latency_ms: llm_latency_ms,
        safety_status: 'clean',
        intent_detected: intent,
        metadata: Chat::SourceProvenance.normalize((msg_metadata || {}).merge(prompt_metadata))
      )

      Chat::InboxBroadcastService.message_created(assistant_msg) if @session.company_id.present?

      # 8. Update session
      @session.increment_message_count!

      # 9. Track PostHog event (async, non-blocking)
      track_response_event(assistant_msg, llm_response, context, retrieval_time_ms: retrieval_time_ms)

      # 10. Return response
      # should_trigger was already determined at step 6

      final_metadata = {
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

      if block_given?
        yield('', true, final_metadata)
      else
        final_metadata
      end
    end

    def prompt_metadata
      prompt = Chat::Prompts.for(@session.vertical)
      {
        'prompt_version' => prompt.id,
        'orchestrator_version' => 'v2',
        'router_version' => 'v2',
        'retrieval_version' => 'v2'
      }
    end

    def success_response_metadata
      company = @session.company
      return {} unless company

      health = CompanyHealthService.call(company)
      actions = NextBestActionService.call(company)
      {
        'prompt_version' => Chat::Prompts.for('success').id,
        'health' => {
          'score' => health[:score],
          'status' => health[:status],
          'missing_items' => Array(health[:missing_items]).first(10)
        },
        'actions' => actions.map { |action| structured_success_action(action) }
      }
    end

    def structured_success_action(action)
      {
        'type' => 'navigate',
        'key' => action[:key] || action['key'] || action[:id] || action['id'],
        'label' => action[:title] || action['title'],
        'route_key' => action.dig(:destination) || action.dig('destination') || action.dig(:action_params, :tab) || action.dig('action_params', 'tab')
      }
    end

    private

    def register_customer_message(message)
      return unless @session.company_id.present?

      now = message.created_at || Time.current
      @session.with_lock do
        @session.update!(
          company_unread_count: @session.company_unread_count + 1,
          last_message_at: now,
          last_customer_message_at: now,
          inbox_status: @session.inbox_status == 'archived' ? 'active' : @session.inbox_status
        )
      end
      Chat::InboxBroadcastService.message_created(message)
      Chat::InboxBroadcastService.session_updated(@session)
    end

    def message_metadata(message)
      {
        id: message.id,
        role: message.role,
        content: message.content,
        created_at: message.created_at
      }
    end

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

    def track_response_event(msg, llm_response, context = nil, retrieval_time_ms: nil)
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
      if context.to_s.include?('=== DYNAMIC COMPANY CONTEXT ===')
        if context.to_s.include?('NENHUMA EMPRESA ENCONTRADA')
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
