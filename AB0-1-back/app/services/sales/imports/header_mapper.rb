# frozen_string_literal: true

module Sales
  module Imports
    class HeaderMapper
      ALIASES = {
        company_name: %w[empresa company companhia razão_social razao_social nome_empresa account],
        contact_name: %w[nome contato pessoa contact nome_contato cliente],
        email: %w[email e-mail correio correio_eletronico],
        phone: %w[telefone phone tel celular mobile fone],
        whatsapp: %w[whatsapp zap whats],
        website: %w[site website url dom_site dominio],
        city: %w[cidade city municipio município],
        state: %w[estado state uf],
        segment: %w[segmento setor ramo atividade vertical],
        job_title: %w[cargo função funcao titulo],
        estimated_value: %w[valor valor_estimado ticket orcamento orçamento proposta],
        source: %w[origem source canal meio],
        owner_identifier: %w[responsavel responsável vendedor owner usuario usuário ddr],
        stage_identifier: %w[estagio estágio fase status stage],
        tags: %w[tags tag etiquetas categoria_tag],
        notes: %w[observacoes observações obs notas note],
        external_id: %w[external_id id_externo codigo código]
      }.freeze

      def self.call(headers)
        new(headers).suggest
      end

      def initialize(headers)
        @headers = Array(headers).map(&:to_s)
      end

      def suggest
        mapping = {}

        @headers.each do |header|
          clean_header = header.strip.downcase.gsub(/[^a-z0-9_áàâãéèêíïóôõöúçñ\s]/, '')

          ALIASES.each do |canonical_field, alias_list|
            next if mapping.value?(canonical_field.to_s)

            alias_match = alias_list.any? do |a|
              clean_header == a || clean_header.include?(a)
            end

            if alias_match
              mapping[header] = canonical_field.to_s
              break
            end
          end
        end

        mapping
      end
    end
  end
end
