# frozen_string_literal: true

module Types
  class BadgeType < Types::BaseObject
    description 'Selo de reconhecimento oficial outorgado pelo Avalia Solar'

    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :category, String, null: true, method: :category_label
    field :year, Integer, null: true
    field :edition, String, null: true
    field :public_slug, String, null: true
    field :image_url, String, null: true
    field :verification_url, String, null: true
    field :position, Integer, null: true
  end
end
