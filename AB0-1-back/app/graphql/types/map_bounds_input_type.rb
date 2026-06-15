# frozen_string_literal: true

# app/graphql/types/map_bounds_input_type.rb
# Input para filtro por viewport do mapa (busca pela área visível no mapa)
module Types
  class MapBoundsInputType < Types::BaseInputObject
    description 'Limites geográficos do viewport do mapa (norte/sul/leste/oeste)'

    argument :north, Float, required: true, description: 'Latitude norte (máxima)'
    argument :south, Float, required: true, description: 'Latitude sul (mínima)'
    argument :east, Float, required: true, description: 'Longitude leste (máxima)'
    argument :west, Float, required: true, description: 'Longitude oeste (mínima)'
  end
end
