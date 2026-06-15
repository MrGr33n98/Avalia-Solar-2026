# frozen_string_literal: true

module Types
  class SearchFacetsType < Types::BaseObject
    description 'Agregações de filtros dinâmicos dos resultados das buscas'

    field :categories, [Types::FacetBucketType], null: false
    field :cities, [Types::FacetBucketType], null: false
    field :states, [Types::FacetBucketType], null: false
  end
end
