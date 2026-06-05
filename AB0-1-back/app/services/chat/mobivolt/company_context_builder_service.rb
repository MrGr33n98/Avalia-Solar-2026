# frozen_string_literal: true

module Chat
  module Mobivolt
    class CompanyContextBuilderService
      def self.build_for(session, user_text)
        new(session, user_text).build
      end

      def initialize(session, user_text)
        @session   = session
        @user_text = user_text.to_s
      end

      def build
        # 1. Extract intents/entities from the user's message text
        entities = Chat::Mobivolt::IntentParserService.parse(@user_text)

        # 2. Fallback: enrich with city/state from the ChatLead already saved for
        #    this session (populated by the wizard). This ensures that even when the
        #    user's message doesn't mention the city explicitly (e.g. "Buscar empresas"),
        #    the matcher still knows where to look.
        entities = enrich_entities_from_lead(entities)

        # If still no recommendation intent and no location at all, return empty.
        return empty_payload(entities) unless entities[:recommendation_intent] || entities[:city].present? || entities[:state].present?

        # 3. Match qualified companies using the enriched entities
        matched_companies = Chat::Mobivolt::CompanyMatcherService.match(entities)

        # 4. Serialize and attach recent reviews
        serialized_companies = matched_companies.map do |company|
          serialized = Chat::Mobivolt::SafeCompanySerializer.serialize(company)
          serialized[:reviews_recentes] = Chat::Mobivolt::ReviewSummaryBuilderService.build_for(company)
          serialized
        end

        {
          busca_realizada: {
            cidade:      entities[:city],
            estado:      entities[:state],
            termo_chave: entities[:keyword],
            categoria:   entities[:category_seo_url],
            source:      @session.page_url
          },
          empresas_encontradas: serialized_companies
        }
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::CompanyContextBuilder] Error building context: #{e.message}")
        empty_payload
      end

      private

      # Enrich entities with city/state from the ChatLead attached to this session.
      # Only fills in fields that weren't already detected from the message text.
      def enrich_entities_from_lead(entities)
        lead = @session.chat_lead
        return entities if lead.nil?

        enriched = entities.dup
        enriched[:city]  ||= lead.city.presence
        enriched[:state] ||= lead.state.presence

        # If we now have location data, treat it as a recommendation intent
        if enriched[:city].present? || enriched[:state].present?
          enriched[:recommendation_intent] = true
        end

        enriched
      rescue StandardError => e
        Rails.logger.warn("[Chat::Mobivolt::CompanyContextBuilder] Could not enrich from lead: #{e.message}")
        entities
      end

      def empty_payload(entities = nil)
        {
          busca_realizada: {
            cidade:      entities&.dig(:city),
            estado:      entities&.dig(:state),
            termo_chave: entities&.dig(:keyword),
            categoria:   entities&.dig(:category_seo_url),
            source:      @session.page_url
          },
          empresas_encontradas: []
        }
      end
    end
  end
end
