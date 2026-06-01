# frozen_string_literal: true

module Chat
  module Mobivolt
    class PromptContextComposer
      def self.compose(payload)
        new(payload).compose
      end

      def initialize(payload)
        @payload = payload || {}
      end

      def compose
        return "" if @payload.blank?

        companies = @payload[:empresas_encontradas] || []
        search = @payload[:busca_realizada] || {}

        context_string = []
        context_string << "=== DYNAMIC COMPANY CONTEXT ==="
        context_string << "Busca Realizada: Cidade: #{search[:cidade] || 'N/A'}, Estado: #{search[:estado] || 'N/A'}, Termo: #{search[:termo_chave] || 'N/A'}, Página: #{search[:source] || 'N/A'}"
        
        if companies.any?
          context_string << "\nEmpresas qualificadas encontradas no banco de dados para recomendar ao usuário:"
          
          companies.each_with_index do |company, idx|
            context_string << "\n[Empresa #{idx + 1}]"
            context_string << "- Nome: #{company[:nome]}"
            context_string << "- Localização: #{company[:cidade]}, #{company[:estado]}"
            context_string << "- Nota Média: #{company[:nota_media] || 'Sem avaliações'} (Total de avaliações: #{company[:total_avaliacoes]})"
            context_string << "- Link do Perfil: #{company[:link_perfil]}"
            context_string << "- Patrocinada/Destaque: #{company[:patrocinada] ? 'Sim' : 'Não'}"
            context_string << "- Selo Verificada: #{company[:verificada] ? 'Sim' : 'Não'}"
            context_string << "- Motivo da Recomendação: #{company[:recommendation_reason] || 'Instalador ativo no Avalia Solar'}"
            context_string << "- Serviços: #{company[:servicos].join(', ')}" if company[:servicos]&.any?
            context_string << "- Especialidades/Nichos: #{company[:nichos].join(', ')}" if company[:nichos]&.any?
            
            if company[:reviews_recentes]&.any?
              context_string << "  Avaliações de clientes reais:"
              company[:reviews_recentes].each do |rev|
                context_string << "    * Autor: #{rev[:autor]} | Nota: #{rev[:nota]} | Comentário: \"#{rev[:comentario]}\""
              end
            end
          end

          context_string << "\nINSTRUÇÕES ADICIONAIS IMPORTANTES:"
          context_string << "- Responda citando e descrevendo as empresas listadas acima para atender a dúvida do usuário."
          context_string << "- Recomende de forma neutra, mas coloque primeiro na listagem/resumo as empresas marcadas como 'Patrocinada/Destaque: Sim'."
          context_string << "- NUNCA cite, recomende ou invente qualquer empresa que não esteja listada no bloco 'Empresas qualificadas encontradas' acima."
          context_string << "- Forneça o Link do Perfil exato correspondente para que o usuário possa acessar e solicitar o orçamento diretamente."
        else
          context_string << "\nNENHUMA EMPRESA ENCONTRADA no banco de dados para os critérios buscados."
          context_string << "\nINSTRUÇÕES ADICIONAIS IMPORTANTES (Nenhuma Empresa):"
          context_string << "- Explique de forma amigável e honesta que atualmente não existem instaladores ativos cadastrados nesta região específica diretamente na nossa base de chat rápida."
          context_string << "- NUNCA invente ou cite empresas fictícias."
          context_string << "- Convide o usuário a preencher seus dados de contato (WhatsApp/E-mail) no formulário que aparecerá na tela para que nossa equipe faça uma busca personalizada e gratuita de orçamentos sob medida para o projeto dele."
        end

        context_string.join("\n")
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::PromptContextComposer] Error composing context string: #{e.message}")
        ""
      end
    end
  end
end
