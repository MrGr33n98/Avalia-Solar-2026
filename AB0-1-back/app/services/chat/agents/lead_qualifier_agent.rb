# frozen_string_literal: true

module Chat
  module Agents
    class LeadQualifierAgent < BaseAgent
      def self.process(session:, user_message:, router_state:, context: nil, agent_result: nil)
        # Normalização do texto
        normalized_text = normalize_text(user_message)
        
        # Análise de intenções
        intent = router_state[:intent].to_s
        is_3rd_msg = session.chat_messages.user_messages.count >= 3
        
        # Verificar intenção comercial nas keywords (usando regex seguro com word boundaries)
        has_commercial_intent = detect_commercial_intent(normalized_text)
        has_urgency = detect_urgency(normalized_text)
        has_location = detect_location(normalized_text)

        # Tratar agent_result (busca vazia)
        companies_empty = false
        if agent_result && agent_result[:metadata]
          companies = agent_result[:metadata]['companies'] || agent_result[:metadata][:companies]
          companies_empty = true if companies.is_a?(Array) && companies.empty?
        end

        # Avaliação principal de Lead Trigger
        should_trigger, reason = evaluate_trigger_rules(
          intent: intent,
          has_commercial_intent: has_commercial_intent,
          is_3rd_msg: is_3rd_msg,
          companies_empty: companies_empty
        )

        # Lead Score preliminar
        base_score = calculate_initial_score(
          has_commercial_intent: has_commercial_intent,
          has_urgency: has_urgency,
          is_3rd_msg: is_3rd_msg,
          intent: intent,
          has_location: has_location
        )
        base_temperature = get_temperature(base_score)

        # Track analytics (NO PII)
        track_qualification(session, router_state, base_score, base_temperature, reason, has_commercial_intent, should_trigger)

        {
          should_trigger_lead: should_trigger,
          lead_score: base_score,
          lead_temperature: base_temperature,
          lead_reason: reason,
          commercial_intent: has_commercial_intent,
          minimum_data_collected: false,
          fallback_triggered: false,
          error: nil
        }
      rescue StandardError => e
        Rails.logger.error("[Chat::Agents::LeadQualifierAgent] Falha na qualificação: #{e.message}")
        fallback_response(e)
      end

      class << self
        private

        def normalize_text(text)
          return '' if text.blank?
          # Transliterate removes accents (e.g. orçamento -> orcamento)
          I18n.transliterate(text).downcase
        end

        def detect_commercial_intent(text)
          # Keywords adaptadas para texto sem acentos
          keywords = [
            'orcamento', 'cotacao', 'instalar', 'contratar',
            'instalacao', 'comparar proposta', 'proposta'
          ]
          
          keywords.any? { |kw| text.match?(/\b#{Regexp.escape(kw)}\b/i) }
        end

        def detect_urgency(text)
          urgency_words = ['urgente', 'pra ontem', 'rapido', 'logo']
          urgency_words.any? { |kw| text.match?(/\b#{Regexp.escape(kw)}\b/i) }
        end

        def detect_location(text)
          # Placeholder simples para detectar locais como "em São Paulo", "no Rio", "cep"
          text.match?(/\b(em |no |na |cep)\b/i)
        end

        def evaluate_trigger_rules(intent:, has_commercial_intent:, is_3rd_msg:, companies_empty:)
          if intent == 'lead_qualification'
            [true, 'lead_qualification_intent']
          elsif intent == 'company_recommendation'
            if has_commercial_intent
              [true, 'company_recommendation_with_commercial']
            elsif companies_empty
              # Busca vazia sem intenção comercial -> NÃO gera lead
              [false, 'empty_search_no_commercial']
            else
              # Tem empresas, mas não tem keyword explícita. Se for 3a msg, trigger.
              if is_3rd_msg
                [true, 'engagement_count']
              else
                [false, 'company_recommendation_informative']
              end
            end
          elsif %w[solar_support solar_assessment financing_question ev_charger_question solar_financing ev_charger_installation].include?(intent)
            if has_commercial_intent
              [true, 'technical_commercial_override']
            else
              [false, 'informative_intent']
            end
          elsif %w[greeting fallback general_question].include?(intent)
            [false, 'informative_intent']
          else
            # Outras intents
            if has_commercial_intent
              [true, 'commercial_intent_detected']
            elsif is_3rd_msg
              [true, 'engagement_count']
            else
              [false, 'default']
            end
          end
        end

        def calculate_initial_score(has_commercial_intent:, has_urgency:, is_3rd_msg:, intent:, has_location:)
          score = 0
          score += 40 if has_commercial_intent
          score += 20 if has_urgency
          score += 10 if is_3rd_msg
          score += 10 if intent == 'company_recommendation'
          score += 30 if intent == 'proposal_analysis' || intent == 'compare_companies'
          score += 10 if has_location

          score.clamp(0, 100)
        end

        def get_temperature(score)
          if defined?(Chat::LeadScoringService) && Chat::LeadScoringService.respond_to?(:temperature_for)
            Chat::LeadScoringService.temperature_for(score)
          else
            if score >= 70
              'hot'
            elsif score >= 30
              'warm'
            else
              'cold'
            end
          end
        end

        def track_qualification(session, router_state, score, temperature, reason, commercial_intent, should_trigger)
          return unless defined?(Chat::PosthogTrackingService)
          
          Chat::PosthogTrackingService.track(
            event: 'mobivolt_lead_qualification_evaluated',
            properties: {
              session_id: session.id,
              intent: router_state[:intent],
              next_agent: router_state[:next_agent],
              lead_score: score,
              lead_temperature: temperature,
              lead_reason: reason,
              commercial_intent: commercial_intent,
              should_trigger_lead: should_trigger,
              fallback_triggered: false
            }
          )
        rescue StandardError => e
          Rails.logger.warn("[Chat::Agents::LeadQualifierAgent] Falha no PostHog: #{e.message}")
        end

        def fallback_response(exception)
          { 
            should_trigger_lead: false, 
            lead_score: 0,
            lead_temperature: 'cold',
            lead_reason: 'error',
            commercial_intent: false,
            fallback_triggered: true, 
            error: exception.message 
          }
        end
      end
    end
  end
end
