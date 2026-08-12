# frozen_string_literal: true

module Chat
  module Agents
    class CompanyRecommendationAgent < BaseAgent
      def self.process(session:, user_message:, router_state:, context: nil)
        # Tenta construir o contexto usando o builder legado, simulando o que o RetrievalService fazia
        payload = Chat::Mobivolt::CompanyContextBuilderService.build_for(session, user_message)
        companies = payload[:empresas_encontradas] || []

        if companies.any?
          content = 'Encontrei algumas opções ativas na sua região. Compare abaixo e solicite orçamentos.'
          metadata = {
            'type' => 'company_recommendations',
            'source' => 'mobivolt_ai',
            'selection_policy' => 'backend_company_recommendation_v1',
            'companies' => companies
          }
        else
          content = 'Não encontrei instaladores ativos nessa região agora. Posso te ajudar a abrir uma busca personalizada para receber opções próximas ou empresas que atendam sua cidade.'
          metadata = {
            'type' => 'company_recommendations',
            'source' => 'mobivolt_ai',
            'selection_policy' => 'backend_company_recommendation_v1',
            'companies' => []
          }
        end

        agent_response(
          content: content,
          metadata: metadata,
          intent: router_state[:intent],
          next_agent: router_state[:next_agent],
          should_trigger_lead: false
        )
      rescue StandardError => e
        Rails.logger.error("[Chat::Agents::CompanyRecommendationAgent] Error: #{e.message}")
        fallback_response(error: e)
      end
    end
  end
end
