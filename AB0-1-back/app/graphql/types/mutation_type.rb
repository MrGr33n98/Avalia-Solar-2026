# frozen_string_literal: true

# app/graphql/types/mutation_type.rb
module Types
  class MutationType < Types::BaseObject
    description 'Mutations disponíveis no Avalia Solar GraphQL API'

    field :create_lead, mutation: Mutations::CreateLead
    field :create_review, mutation: Mutations::CreateReview
  end
end
