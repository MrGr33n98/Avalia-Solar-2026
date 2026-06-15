# frozen_string_literal: true

module Types
  class ArticlesConnectionType < Types::BaseObject
    description 'Resultado paginado de artigos do blog'

    field :nodes, [Types::ArticleType], null: false
    field :page_info, Types::PageInfoType, null: false
  end
end
