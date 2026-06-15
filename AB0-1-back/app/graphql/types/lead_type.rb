# frozen_string_literal: true

# app/graphql/types/lead_type.rb
# ATENÇÃO: Apenas campos mínimos públicos — dados pessoais protegidos
module Types
  class LeadType < Types::BaseObject
    description 'Solicitação de orçamento (lead)'

    field :id, ID, null: false
    field :status, String, null: true
    field :service_type, String, null: true
    field :message, String, null: true
    field :city, String, null: true
    field :state, String, null: true
    field :origin, String, null: true
    field :company_id, ID, null: true
    field :company, Types::CompanyType, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def status
      object.wizard_status
    end

    def service_type
      object.product_vertical || object.project_type
    end

    def origin
      object.landing_path || object.utm_source
    end
  end
end
