# frozen_string_literal: true

require 'uri'
require 'cgi'

module Chat
  class RetrievalService
    # MVP: Simple DB-based context retrieval
    # Future: pgvector embeddings + semantic search
    def self.context_for(session)
      parts = []
      dynamic_success = false
      query = session.chat_messages.user_messages.last&.content.to_s
      domains = domains_for(query, session.vertical)

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

      # 2. Contexto da Empresa Parceira (MobiVolt Success ou Usuário Logado)
      company = nil
      if session.user.present? && session.user.company.present?
        company = session.user.company
      elsif session.vertical == 'success'
        if session.page_url.present?
          begin
            uri = URI.parse(session.page_url)
            params = CGI.parse(uri.query) if uri.query.present?
            company_id = params&.dig('company_id')&.first
            company = Company.find_by(id: company_id) if company_id.present?
          rescue StandardError => e
            Rails.logger.error("[Chat::RetrievalService] Error parsing page_url: #{e.message}")
          end
        end
      end

      if company.present?
        parts << company_success_context(company, domains)
      elsif !dynamic_success && session.page_url&.include?('/companies/')
        slug = session.page_url.split('/companies/').last&.split('?')&.first
        comp = Company.find_by(slug: slug) if slug.present?
        parts << company_context(comp) if comp.present?
      end

      # Add vertical context
      parts << vertical_context(session.vertical) if session.vertical.present?

      # Add general platform context
      parts << platform_stats_context unless session.vertical == 'success'

      parts.compact.join("\n\n")
    end

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

    def self.company_success_context(company, domains)
      fields = []
      if domains.include?(:profile)
        fields << "- Nome público: #{company.name}"
        fields << "- Website: #{company.website || 'Não informado'}"
        fields << "- Descrição: #{company.description.to_s.truncate(200)}"
        fields << "- Categorias: #{company.categories.map(&:name).join(', ').presence || 'Nenhuma cadastrada'}"
      end
      if domains.include?(:coverage)
        fields << "- Cidade/Estado: #{company.city || 'Não informado'} - #{company.state || 'Não informado'}"
        fields << "- Estados de atendimento: #{company.coverage_states.presence || 'Não informado'}"
        fields << "- Cidades de atendimento: #{company.coverage_cities.presence || 'Não informado'}"
      end
      if domains.include?(:plans) || domains.include?(:entitlements)
        fields << "- Entitlements disponíveis: #{company.feature_access.keys.join(', ')}"
      end
      if domains.include?(:products)
        products = company.products.active.limit(10).pluck(:name).join(', ') rescue ''
        fields << "- Produtos: #{products.presence || 'Nenhum produto cadastrado'}"
      end
      return if fields.empty?

      "CONTEXTO DA EMPRESA (somente campos necessários):\n#{fields.join('\n')}"
    end

    def self.domains_for(query, vertical)
      text = query.to_s.downcase
      return %i[health] if text.match?(/saúde|score|melhorar|recomend|health|ação/)
      return %i[coverage] if text.match?(/cobertura|cidade|estado|atend/)
      return %i[entitlements plans] if text.match?(/plano|recurso|entitlement|disponível|limite/)
      return %i[products] if text.match?(/produto|catálogo|serviço/)
      return %i[profile] if vertical.to_s == 'success'

      %i[profile]
    end

    def self.vertical_context(vertical)
      case vertical
      when 'solar'
        'O usuário está interessado em ENERGIA SOLAR. Foque em painéis solares, inversores, instalação, financiamento, manutenção e economia na conta de luz.'
      when 'electric_mobility'
        'O usuário está interessado em MOBILIDADE ELÉTRICA. Foque em carregadores, wallbox, eletropostos, frota elétrica e soluções para condomínios.'
      when 'success'
        'O usuário atual é uma empresa parceira (cliente) acessando o Dashboard. Ele está na fase de onboarding/configuração. Ajude-o a entender o painel e incentivar o preenchimento de dados como cobertura geográfica e contatos.'
      end
    end

    def self.platform_stats_context
      company_count = begin
        Rails.cache.fetch('chat:platform_stats:active_companies', expires_in: 10.minutes) { Company.where(status: 'active').count }
      rescue StandardError
        0
      end
      "A plataforma Avalia Solar possui #{company_count} empresas ativas cadastradas."
    end
  end
end
