# frozen_string_literal: true

# app/graphql/types/company_type.rb
# ATENÇÃO: Campos sensíveis (email, phone, cnpj, whatsapp) NÃO são expostos aqui.
# Dados de contato só aparecem quando canViewContact = true (plano/autenticação).
module Types
  class CompanyType < Types::BaseObject
    description 'Empresa parceira no marketplace Avalia Solar'

    # Identificação
    field :id, ID, null: false
    field :name, String, null: false
    field :slug, String, null: false
    field :segment, String, null: true

    # Descrição pública
    field :description, String, null: true
    field :short_description, String, null: true

    # Mídia
    field :logo_url, String, null: true
    field :cover_url, String, null: true, method: :banner_url

    # Localização
    field :city, String, null: true
    field :state, String, null: true

    # Avaliações
    field :rating_avg, Float, null: true
    field :reviews_count, Integer, null: true, method: :rating_count

    # Status
    field :is_verified, Boolean, null: true, method: :verified
    field :is_featured, Boolean, null: true, method: :featured
    field :is_sponsored, Boolean, null: true, method: :sponsored

    # Web
    field :website, String, null: true

    # Serviços/Tipos de projeto
    field :project_types, [String], null: true
    field :services_offered, [String], null: true

    # Cobertura geográfica
    field :coverage_states, [String], null: true
    field :coverage_cities, [String], null: true

    # Associações
    field :categories, [Types::CategoryType], null: true
    field :badges, [String], null: true
    field :reviews, [Types::ReviewType], null: true do
      argument :limit, Integer, required: false, default_value: 5
    end

    # Contato (condicional — respeita regra de plano)
    field :can_view_contact, Boolean, null: false
    field :whatsapp_url, String, null: true

    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    # Resolvendo associações

    def categories
      dataloader.with(::Loaders::AssociationLoader, :categories).load(object)
    end

    def badges
      badges_list = dataloader.with(::Loaders::AssociationLoader, :badges).load(object)
      badges_list.select(&:active).map(&:name)
    rescue StandardError
      []
    end

    def reviews(limit:)
      reviews_list = dataloader.with(::Loaders::AssociationLoader, :reviews).load(object)
      reviews_list.select { |r| r.status == 'approved' }.sort_by(&:created_at).reverse.first(limit)
    end

    def coverage_states
      object.coverage_state_list
    rescue StandardError
      []
    end

    def coverage_cities
      object.coverage_city_list
    rescue StandardError
      []
    end

    # Regra de contato: respeita plano e autenticação
    def can_view_contact
      return false unless object.respond_to?(:cta_whatsapp_enabled)

      object.cta_whatsapp_enabled
    rescue StandardError
      false
    end

    # WhatsApp URL só é retornado se o acesso de contato for permitido
    def whatsapp_url
      return nil unless can_view_contact

      object.try(:whatsapp_url)
    end

    def logo_url
      object.try(:logo_url)
    end

    def banner_url
      object.try(:banner_url)
    end
  end
end
