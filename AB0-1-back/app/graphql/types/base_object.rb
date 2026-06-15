# frozen_string_literal: true

# app/graphql/types/base_object.rb
module Types
  class BaseObject < GraphQL::Schema::Object
    field_class Types::BaseField
  end
end
