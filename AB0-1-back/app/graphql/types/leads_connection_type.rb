# frozen_string_literal: true

module Types
  class LeadsConnectionType < Types::BaseObject
    description 'Resultado paginado de leads do usuário'

    field :nodes, [Types::LeadType], null: false
    field :page_info, Types::PageInfoType, null: false
  end
end
