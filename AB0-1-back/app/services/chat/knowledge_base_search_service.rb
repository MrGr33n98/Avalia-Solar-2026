# frozen_string_literal: true

module Chat
  class KnowledgeBaseSearchService
    def self.call(query:)
      new(query: query).call
    end

    def initialize(query:)
      @query = query
    end

    def call
      return [] if @query.blank?

      # Busca artigos publicados no banco usando FTS ordenados por relevância
      articles = KnowledgeArticle.published.search_by_text(@query).limit(3)
      articles.to_a
    rescue StandardError => e
      Rails.logger.error("[Chat::KnowledgeBaseSearchService] Search failed: #{e.class}")
      []
    end
  end
end
