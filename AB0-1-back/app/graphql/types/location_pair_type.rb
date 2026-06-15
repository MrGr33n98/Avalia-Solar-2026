# frozen_string_literal: true

module Types
  class LocationPairType < Types::BaseObject
    description 'Par de geolocalização com Cidade e Estado'

    field :city, String, null: false
    field :state, String, null: false
  end
end
