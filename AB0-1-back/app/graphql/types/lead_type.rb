# frozen_string_literal: true

# app/graphql/types/lead_type.rb
# ATENÇÃO: Apenas campos mínimos públicos — dados pessoais protegidos
module Types
  class LeadType < Types::BaseObject
    description 'Solicitação de orçamento (lead)'

    field :id, ID, null: false
    field :status, String, null: true

    def status
      object.wizard_status
    end
    field :company_id, ID, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
