# frozen_string_literal: true

module Types
  class ArticleType < Types::BaseObject
    description 'Artigo de conteúdo explicativo ou blog no marketplace'

    field :id, ID, null: false
    field :title, String, null: false
    field :slug, String, null: true
    field :content, String, null: true
  end
end
