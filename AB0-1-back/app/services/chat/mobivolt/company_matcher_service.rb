# frozen_string_literal: true

module Chat
  module Mobivolt
    class CompanyMatcherService
      def self.match(entities)
        new(entities).match
      end

      def initialize(entities)
        @entities = entities || {}
      end

      def match
        relation = Company.active.installers

        # Filtragem geográfica
        if @entities[:city].present?
          relation = relation.by_city(@entities[:city])
        elsif @entities[:state].present?
          relation = relation.by_state(@entities[:state])
        end

        # Filtragem por termo de texto/busca
        if @entities[:keyword].present?
          relation = relation.search_by_text(@entities[:keyword])
        end

        # Ordenação prioritária (sponsored first, algoritmo ponderado)
        relation = relation.ordered_by_priority

        # Limita a no máximo 5 registros
        relation.limit(5)
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::CompanyMatcher] Error matching companies: #{e.message}")
        Company.none
      end
    end
  end
end
