# frozen_string_literal: true

# app/graphql/types/base_input_object.rb
module Types
  class BaseInputObject < GraphQL::Schema::InputObject
    argument_class Types::BaseArgument
  end
end
