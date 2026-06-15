# frozen_string_literal: true

# app/graphql/types/map_company_type.rb
# Tipo simplificado de empresa para o painel de mapa.
# Retorna apenas campos necessários para renderizar pins (evita payloads gigantes).
module Types
  class MapCompanyType < Types::BaseObject
    description 'Empresa simplificada para renderização no mapa'

    field :id, ID, null: false
    field :name, String, null: false
    field :slug, String, null: false
    field :latitude, Float, null: true
    field :longitude, Float, null: true
    field :rating_avg, Float, null: true
    field :is_sponsored, Boolean, null: true, method: :sponsored
    field :is_verified, Boolean, null: true, method: :verified
    field :city, String, null: true
    field :state, String, null: true
  end
end
