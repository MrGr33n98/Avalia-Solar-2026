# frozen_string_literal: true

module Types
  class FacetBucketType < Types::BaseObject
    description 'Item individual de uma agregação de filtro com contagem correspondente'

    field :key, String, null: false
    field :count, Integer, null: false
  end
end
