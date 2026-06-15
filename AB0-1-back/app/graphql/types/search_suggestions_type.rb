# frozen_string_literal: true

module Types
  class SearchSuggestionsType < Types::BaseObject
    description 'Resultados estruturados para autocomplete e sugestões de busca rápida'

    field :companies, [Types::CompanyType], null: false
    field :products, [Types::ProductType], null: false
    field :categories, [Types::CategoryType], null: false
    field :articles, [Types::ArticleType], null: false
  end
end
