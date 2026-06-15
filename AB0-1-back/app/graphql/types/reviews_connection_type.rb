# frozen_string_literal: true

module Types
  class ReviewsConnectionType < Types::BaseObject
    description 'Resultado paginado de avaliações do usuário'

    field :nodes, [Types::ReviewType], null: false
    field :page_info, Types::PageInfoType, null: false
  end
end
