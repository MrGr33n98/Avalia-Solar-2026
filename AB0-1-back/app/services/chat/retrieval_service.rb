# frozen_string_literal: true

module Chat
  class RetrievalService
    # MVP: Simple DB-based context retrieval
    # Future: pgvector embeddings + semantic search
    def self.context_for(session)
      parts = []
      dynamic_success = false

      # 1. Tenta buscar o contexto dinâmico se a feature flag estiver habilitada
      if ActiveModel::Type::Boolean.new.cast(ENV.fetch('CHAT_DYNAMIC_CONTEXT_ENABLED', 'false'))
        begin
          last_msg = session.chat_messages.user_messages.last&.content
          if last_msg.present?
            payload = Chat::Mobivolt::CompanyContextBuilderService.build_for(session, last_msg)
            dynamic_context = Chat::Mobivolt::PromptContextComposer.compose(payload)
            if dynamic_context.present?
              parts << dynamic_context
              dynamic_success = true
              
              # Salva o payload estruturado para que o OrchestratorService possa anexar à mensagem
              if payload[:empresas_encontradas]&.any?
                session.update!(
                  metadata: (session.metadata || {}).merge(
                    'last_recommendation_payload' => {
                      'type' => 'company_recommendations',
                      'source' => 'mobivolt_ai',
                      'companies' => payload[:empresas_encontradas]
                    }
                  )
                )
              end
            end
          end
        rescue StandardError => e
          Rails.logger.error("[Chat::RetrievalService] Failed to build dynamic context: #{e.message}")
        end
      end

      # 2. Fallback para comportamento MVP de URL se a busca dinâmica falhar ou estiver desativada
      if !dynamic_success && session.page_url&.include?('/companies/')
        slug = session.page_url.split('/companies/').last&.split('?')&.first
        company = Company.find_by(slug: slug) if slug.present?
        if company
          parts << company_context(company)
        end
      end

      # Add vertical context
      if session.vertical.present?
        parts << vertical_context(session.vertical)
      end

      # Add general platform context
      parts << platform_stats_context

      parts.compact.join("\n\n")
    end

    private

    def self.company_context(company)
      <<~CTX
        EMPRESA NA PÁGINA ATUAL:
        - Nome: #{company.name}
        - Cidade: #{company.city}, #{company.state}
        - Categoria: #{company.categories.first&.name || 'Geral'}
        - Nota média: #{company.rating_avg || 'Sem avaliações'}
        - Total de avaliações: #{company.rating_count || 0}
        - Descrição: #{company.description.to_s.truncate(200)}
      CTX
    end

    def self.vertical_context(vertical)
      case vertical
      when 'solar'
        "O usuário está interessado em ENERGIA SOLAR. Foque em painéis solares, inversores, instalação, financiamento, manutenção e economia na conta de luz."
      when 'electric_mobility'
        "O usuário está interessado em MOBILIDADE ELÉTRICA. Foque em carregadores, wallbox, eletropostos, frota elétrica e soluções para condomínios."
      when 'success'
        "O usuário atual é uma empresa parceira (cliente) acessando o Dashboard. Ele está na fase de onboarding/configuração. Ajude-o a entender o painel e incentivar o preenchimento de dados como cobertura geográfica e contatos."
      end
    end

    def self.platform_stats_context
      company_count = Company.where(status: 'active').count rescue 0
      "A plataforma Avalia Solar possui #{company_count} empresas ativas cadastradas."
    end
  end
end
