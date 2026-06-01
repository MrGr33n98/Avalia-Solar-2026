# frozen_string_literal: true

module Chat
  class RetrievalService
    # MVP: Simple DB-based context retrieval
    # Future: pgvector embeddings + semantic search
    def self.context_for(session)
      parts = []

      # Add page-specific context
      if session.page_url&.include?('/companies/')
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
        - Categoria: #{company.category_name}
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
      end
    end

    def self.platform_stats_context
      company_count = Company.where(status: 'active').count rescue 0
      "A plataforma Avalia Solar possui #{company_count} empresas ativas cadastradas."
    end
  end
end
