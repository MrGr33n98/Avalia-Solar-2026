# frozen_string_literal: true

# app/graphql/types/review_type.rb
# ATENÇÃO: Não expõe dados pessoais do autor (email, user_id raw)
module Types
  class ReviewType < Types::BaseObject
    description 'Avaliação de uma empresa'

    field :id, ID, null: false
    field :rating, Float, null: false
    field :comment, String, null: true
    field :headline, String, null: true
    field :pros, [String], null: true
    field :cons, [String], null: true
    field :buyer_tip, String, null: true
    field :author_name, String, null: true
    field :company_reply, String, null: true, method: :reply
    field :replied_at, GraphQL::Types::ISO8601DateTime, null: true
    field :status, String, null: true
    field :project_type, String, null: true
    field :installation_status, String, null: true
    field :featured, Boolean, null: true
    field :verified, Boolean, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    # Retorna apenas o primeiro nome do autor por privacidade
    def author_name
      user = object.user
      return 'Anônimo' if user.nil?

      full_name = user.name.to_s.strip
      return 'Usuário' if full_name.blank?

      # Retorna apenas primeiro nome por privacidade
      full_name.split.first
    end
  end
end
