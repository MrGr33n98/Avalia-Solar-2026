# frozen_string_literal: true

module Chat
  module Mobivolt
    class CompanyContextBuilderService
      def self.build_for(session, user_text)
        new(session, user_text).build
      end

      def initialize(session, user_text)
        @session = session
        @user_text = user_text.to_s
      end

      def build
        # 1. Extração de intenções e entidades
        entities = Chat::Mobivolt::IntentParserService.parse(@user_text)

        # Se não há intenção de recomendação clara, retorna payload vazio
        return empty_payload(entities) unless entities[:recommendation_intent]

        # 2. Match de instaladores qualificados
        matched_companies = Chat::Mobivolt::CompanyMatcherService.match(entities)

        # 3. Serialização segura e acoplamento de depoimentos de clientes
        serialized_companies = matched_companies.map do |company|
          serialized = Chat::Mobivolt::SafeCompanySerializer.serialize(company)
          serialized[:reviews_recentes] = Chat::Mobivolt::ReviewSummaryBuilderService.build_for(company)
          serialized
        end

        {
          busca_realizada: {
            cidade: entities[:city],
            estado: entities[:state],
            termo_chave: entities[:keyword],
            categoria: entities[:category_seo_url],
            source: @session.page_url
          },
          empresas_encontradas: serialized_companies
        }
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::CompanyContextBuilder] Error building context: #{e.message}")
        empty_payload
      end

      private

      def empty_payload(entities = nil)
        {
          busca_realizada: {
            cidade: entities&.dig(:city),
            estado: entities&.dig(:state),
            termo_chave: entities&.dig(:keyword),
            categoria: entities&.dig(:category_seo_url),
            source: @session.page_url
          },
          empresas_encontradas: []
        }
      end
    end
  end
end
