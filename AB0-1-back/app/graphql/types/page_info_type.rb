# frozen_string_literal: true

# app/graphql/types/page_info_type.rb
module Types
  class PageInfoType < Types::BaseObject
    description 'Informações de paginação'

    field :current_page, Integer, null: false
    field :total_pages, Integer, null: false
    field :total_count, Integer, null: false
    field :per_page, Integer, null: false
    field :has_next_page, Boolean, null: false
    field :has_previous_page, Boolean, null: false
  end
end
