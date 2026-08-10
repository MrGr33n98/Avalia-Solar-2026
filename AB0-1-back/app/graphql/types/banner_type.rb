# frozen_string_literal: true

module Types
  class BannerType < Types::BaseObject
    description 'Banner promocional'

    field :id, ID, null: false
    field :title, String, null: true
    field :link, String, null: true
    field :active, Boolean, null: false
    field :position, String, null: true
    field :sponsored, Boolean, null: false
    field :banner_type, String, null: true
    field :category_id, ID, null: true
    field :company_id, ID, null: true
    field :start_date, GraphQL::Types::ISO8601DateTime, null: true
    field :end_date, GraphQL::Types::ISO8601DateTime, null: true
    field :width, Integer, null: true
    field :height, Integer, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    # Métodos expostos pelo model Banner
    field :image_url, String, null: true
    field :link_url, String, null: true
    field :delivery_id, String, null: true
    field :category_ids, [ID], null: false

    def delivery_id
      Digest::SHA256.hexdigest("#{object.id}:graphql:#{object.position}")[0, 32]
    end
  end
end
