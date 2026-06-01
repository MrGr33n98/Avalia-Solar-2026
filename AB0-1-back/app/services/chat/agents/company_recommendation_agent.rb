# frozen_string_literal: true

module Chat
  module Agents
    class CompanyRecommendationAgent < BaseAgent
      def self.process(session:, user_message:, router_state:, context: nil)
        # Tenta construir o contexto usando o builder legado, simulando o que o RetrievalService fazia
        payload = Chat::Mobivolt::CompanyContextBuilderService.build_for(session, user_message)
        companies = payload[:empresas_encontradas] || []

        should_trigger = determine_lead_trigger(session, user_message, companies)

        if companies.any?
          content = "Encontrei algumas opções ativas na sua região. Compare abaixo e solicite orçamentos."
          metadata = {
            'type' => 'company_recommendations',
            'source' => 'mobivolt_ai',
            'companies' => companies
          }
        else
          content = "Não encontrei instaladores ativos nessa região agora. Posso te ajudar a abrir uma busca personalizada para receber opções próximas ou empresas que atendam sua cidade."
          metadata = {
            'type' => 'company_recommendations',
            'source' => 'mobivolt_ai',
            'companies' => []
          }
        end

        agent_response(
          content: content,
          metadata: metadata,
          intent: router_state[:intent],
          next_agent: router_state[:next_agent],
          should_trigger_lead: should_trigger
        )
      rescue StandardError => e
        Rails.logger.error("[Chat::Agents::CompanyRecommendationAgent] Error: #{e.message}")
        fallback_response(error: e)
      end

      private

      def self.determine_lead_trigger(session, user_message, companies)
        # Regra definida no UAT da Fase 3A: true apenas se o usuário demonstrou intenção comercial clara
        # ou pressa, ou orçamento. Além disso, se for a 3ª mensagem, disparar lead automaticamente.
        text = user_message.downcase
        commercial_keywords = %w[orçamento cotação instalar contratar pra\ ontem urgente preço comparar\ proposta]
        has_commercial_intent = commercial_keywords.any? { |kw| text.include?(kw) }
        
        has_commercial_intent || session.chat_messages.user_messages.count >= 3
      end
    end
  end
end
