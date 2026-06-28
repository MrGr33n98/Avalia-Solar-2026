# frozen_string_literal: true

# app/graphql/types/map_result_type.rb
# Payload do mapa retornado pela query de busca.
# Contém empresas simplificadas para renderização de pins.
module Types
  class MapResultType < Types::BaseObject
    description 'Resultado do painel de mapa na busca'

    field :companies, [Types::MapCompanyType], null: false,
                                               description: 'Empresas com coordenadas para renderização de pins no mapa'
    field :total_count, Integer, null: false,
                                 description: 'Total de empresas com coordenadas no resultado'
  end
end
