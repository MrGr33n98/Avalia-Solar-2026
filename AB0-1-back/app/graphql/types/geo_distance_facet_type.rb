# frozen_string_literal: true

# app/graphql/types/geo_distance_facet_type.rb
# Facetas de distância para a sidebar de busca ("Empresas a até X km")
module Types
  class GeoDistanceFacetType < Types::BaseObject
    description 'Faceta de distância geográfica para filtro de busca'

    field :label, String, null: false, description: 'Ex: "Até 10 km"'
    field :value, Integer, null: false, description: 'Raio em km (10, 30, 50, 100)'
    field :count, Integer, null: false, description: 'Quantidade de empresas dentro deste raio'
  end
end
