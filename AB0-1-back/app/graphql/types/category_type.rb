# frozen_string_literal: true

# app/graphql/types/category_type.rb
module Types
  class CategoryType < Types::BaseObject
    description 'Uma categoria de empresas no marketplace'

    field :id, ID, null: false
    field :name, String, null: false
    field :slug, String, null: true, method: :seo_url
    field :short_description, String, null: true
    field :description, String, null: true
    field :icon_url, String, null: true
    field :banner_url, String, null: true
    field :companies_count, Integer, null: true
    field :featured, Boolean, null: true
    field :position, Integer, null: true
    field :parent_id, ID, null: true
    field :children, [Types::CategoryType], null: true

    def children
      object.children.where(status: 'active').order(:name)
    end

    def icon_url
      object.try(:icon_url)
    end

    def banner_url
      object.try(:banner_url)
    end
  end
end
