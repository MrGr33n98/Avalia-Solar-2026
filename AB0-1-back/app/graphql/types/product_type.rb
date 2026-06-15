# frozen_string_literal: true

module Types
  class ProductType < Types::BaseObject
    description 'Um produto (ex: painel, inversor) disponível no marketplace'

    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :price, Float, null: true
    field :image_url, String, null: true
  end
end
