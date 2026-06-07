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
        parts << company_success_context(company)
      elsif !dynamic_success && session.page_url&.include?('/companies/')
        slug = session.page_url.split('/companies/').last&.split('?')&.first
        comp = Company.find_by(slug: slug) if slug.present?
        parts << company_context(comp) if comp.present?
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

    def self.company_success_context(company)
      categories = company.categories.map(&:name).join(', ')
      coverage_states = company.coverage_states.presence || 'Não informado (Atende apenas a cidade sede)'
      coverage_cities = company.coverage_cities.presence || 'Não informado (Atende apenas a cidade sede)'
      niche_tags = Array(company.niche_tags).join(', ')
      project_types = Array(company.project_types).join(', ')
      services = Array(company.services_offered).join(', ')
      products = company.products.active.limit(10).map(&:name).join(', ') rescue ''
      faqs = company.company_faqs.limit(5).map { |f| "P: #{f.question} | R: #{f.answer}" }.join("\n") rescue ''

      <<~CTX
        PERFIL COMPLETO DA SUA EMPRESA (LOGADA):
        - Nome Fantasia: #{company.name}
        - Razão Social / CNPJ: #{company.cnpj || 'Não informado'}
        - Status na Plataforma: #{company.status}
        - Website: #{company.website || 'Não informado'}
        - Contatos cadastrados:
          * Telefone Comercial: #{company.phone || 'Não informado'}
          * WhatsApp: #{company.whatsapp || 'Não informado'} (URL: #{company.whatsapp_url || 'Não configurada'})
          * E-mail Público: #{company.email_public || 'Não informado'}
        - Plano Atual: #{company.plan&.name || 'Nenhum / Free'} (Tier: #{company.inferred_plan_tier}, Status do Plano: #{company.plan_status})
        - Localização da Sede: #{company.city || 'Não informado'} - #{company.state || 'Não informado'}
        - Categorias / Especialidades em que está inscrito: #{categories.presence || 'Nenhuma cadastrada'}
        - Zonas de Cobertura Geográfica:
          * Estados de Atendimento: #{coverage_states}
          * Cidades de Atendimento: #{coverage_cities}
        - Especialidades (Tags de Nicho): #{niche_tags.presence || 'Não configuradas'}
        - Tipos de Projetos que Atende: #{project_types.presence || 'Não configurados'}
        - Serviços Prestados: #{services.presence || 'Não configurados'}
        - Produtos Cadastrados no Catálogo: #{products.presence || 'Nenhum produto cadastrado'}
        #{"- Perguntas Frequentes (FAQs) Cadastradas:\n" + faqs if faqs.present?}
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
