# frozen_string_literal: true

# app/graphql/types/base_field.rb
module Types
  class BaseField < GraphQL::Schema::Field
    argument_class Types::BaseArgument
  end
end
