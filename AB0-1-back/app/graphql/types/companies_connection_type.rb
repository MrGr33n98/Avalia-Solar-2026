# frozen_string_literal: true

# app/graphql/types/companies_connection_type.rb
# Wrapper de paginação para a query companies
module Types
  class CompaniesConnectionType < Types::BaseObject
    description 'Resultado paginado de empresas'

    field :nodes, [Types::CompanyType], null: false
    field :page_info, Types::PageInfoType, null: false
    field :facets, Types::SearchFacetsType, null: true
    # GEO: payload para o painel de mapa (empresas com coordenadas)
    field :map, Types::MapResultType, null: true
  end
end
