# frozen_string_literal: true

module Chat
  module Agents
    class SupportAgent < BaseAgent
      def self.process(session:, user_message:, router_state:, context: nil)
        intent = router_state[:intent] || 'general_question'
        next_agent = router_state[:next_agent]

        # 1. Track PostHog Invocation (Secure, no PII)
        track_event(
          session: session,
          event: 'mobivolt_support_agent_invoked',
          properties: { intent: intent }
        )

        # 2. Search Knowledge Base using FTS
        articles = Chat::KnowledgeBaseSearchService.call(query: user_message)

        if articles.any?
          # Build strict context instruction
          strict_instruction = <<~INSTRUCTION
            INSTRUÇÃO CRÍTICA DE SUPORTE:
            - Responda à dúvida do usuário baseando-se EXCLUSIVAMENTE nos artigos fornecidos abaixo.
            - Se os artigos abaixo não contiverem a resposta para a dúvida específica, diga de forma educada e muito curta que não tem essa informação confiável na base de conhecimento.
            - NÃO invente fatos, dados, especificações técnicas ou preços que não estejam nos artigos.
            - A resposta deve ser curta, direta e conversacional (máximo 4 a 6 linhas antes de eventuais quebras).
            - Não cite empresas ou prestadores de serviços, apenas tire a dúvida técnica.
          INSTRUCTION

          context_str = "#{strict_instruction}\n\nARTIGOS DE SUPORTE RECUPERADOS:\n" + articles.map do |art|
            "Título: #{art.title}\nCategoria: #{art.category&.name}\nConteúdo: #{art.content}"
          end.join("\n\n")

          # 3. Call LlmGateway with controlled context
          llm_response = Chat::LlmGateway.call(
            messages: [{ role: 'user', content: user_message }],
            context: context_str
          )

          if llm_response[:success] && llm_response[:content].present?
            content = llm_response[:content]
            sources = articles.map { |a| { 'title' => a.title, 'slug' => a.slug } }
            primary_category = articles.first.category&.name
            confidence = 1.0

            metadata = {
              'type' => 'support_answer',
              'sources' => sources,
              'knowledge_category' => primary_category,
              'confidence_score' => confidence
            }

            track_event(
              session: session,
              event: 'mobivolt_support_answer_success',
              properties: {
                intent: intent,
                knowledge_category: primary_category,
                confidence_score: confidence,
                sources_count: sources.size,
                fallback_triggered: false
              }
            )

            return agent_response(
              content: content,
              metadata: metadata,
              intent: intent,
              next_agent: next_agent,
              should_trigger_lead: false
            )
          else
            # LlmGateway failed
            return trigger_fallback(session: session, intent: intent, next_agent: next_agent, error_msg: 'LlmGateway failed or returned empty content')
          end
        else
          # No articles found (Empty/Fallback Honesto)
          content = 'Não encontrei uma resposta confiável na minha base ainda. Posso te ajudar a procurar empresas ou especialistas que atendam esse tema.'
          metadata = {
            'type' => 'support_answer',
            'sources' => [],
            'knowledge_category' => nil,
            'confidence_score' => 0.0
          }

          track_event(
            session: session,
            event: 'mobivolt_support_answer_empty',
            properties: {
              intent: intent,
              knowledge_category: nil,
              confidence_score: 0.0,
              sources_count: 0,
              fallback_triggered: true
            }
          )

          return agent_response(
            content: content,
            metadata: metadata,
            intent: intent,
            next_agent: next_agent,
            should_trigger_lead: false,
            fallback_triggered: true
          )
        end
      rescue StandardError => e
        Rails.logger.error("[Chat::Agents::SupportAgent] Error in processing: #{e.message}")
        trigger_fallback(session: session, intent: intent, next_agent: next_agent, error_msg: e.message)
      end

      private

      def self.trigger_fallback(session:, intent:, next_agent:, error_msg:)
        content = 'Não encontrei uma resposta confiável na minha base ainda. Posso te ajudar a procurar empresas ou especialistas que atendam esse tema.'
        metadata = {
          'type' => 'support_answer',
          'sources' => [],
          'knowledge_category' => nil,
          'confidence_score' => 0.0
        }

        track_event(
          session: session,
          event: 'mobivolt_support_agent_fallback',
          properties: {
            intent: intent,
            knowledge_category: nil,
            confidence_score: 0.0,
            sources_count: 0,
            fallback_triggered: true
          }
        )

        agent_response(
          content: content,
          metadata: metadata,
          intent: intent,
          next_agent: next_agent,
          should_trigger_lead: false,
          fallback_triggered: true,
          error: error_msg
        )
      end

      def self.track_event(session:, event:, properties:)
        return unless defined?(Chat::PosthogTrackingService)

        # Merge base properties safely (no PII)
        safe_props = properties.merge(
          session_id: session.id,
          visitor_id: session.visitor_id
        )

        Chat::PosthogTrackingService.track(
          event: event,
          properties: safe_props,
          distinct_id: session.visitor_id
        )
      rescue StandardError => e
        Rails.logger.warn("[Chat::Agents::SupportAgent] Failed to track event #{event}: #{e.message}")
      end
    end
  end
end
