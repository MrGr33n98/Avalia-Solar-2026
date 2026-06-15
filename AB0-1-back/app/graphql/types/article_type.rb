# frozen_string_literal: true

module Types
  class ArticleType < Types::BaseObject
    description 'Artigo de conteúdo explicativo ou blog no marketplace'

    field :id, ID, null: false
    field :title, String, null: false
    field :slug, String, null: false
    field :excerpt, String, null: true
    field :body, String, null: true, method: :content
    field :cover_url, String, null: true
    field :category, Types::CategoryType, null: true
    field :tags, [String], null: false
    field :published_at, GraphQL::Types::ISO8601DateTime, null: true
    field :reading_time, Integer, null: false
    field :author_name, String, null: true
    field :seo_title, String, null: true, method: :meta_title
    field :seo_description, String, null: true, method: :meta_description
    field :related_articles, [Types::ArticleType], null: false

    def cover_url
      return nil unless object.banner.attached?

      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      Rails.application.routes.url_helpers.rails_storage_proxy_url(object.banner, options)
    rescue StandardError => e
      Rails.logger.error("Error generating cover URL for article #{object.id}: #{e.message}")
      nil
    end

    def tags
      # Como não há tabela de tags no schema do banco de dados, retornamos uma lista vazia
      []
    end

    def reading_time
      body_text = object.content.to_s
      word_count = body_text.split.size
      words_per_minute = 200
      [(word_count / words_per_minute.to_f).ceil, 1].max
    end

    def author_name
      object.author&.name || object.author&.email || 'Autor'
    end

    def related_articles
      Article.published.where(category_id: object.category_id).where.not(id: object.id).limit(3)
    end
  end
end
