# frozen_string_literal: true

# app/graphql/mutations/create_review.rb
# Cria uma avaliação. Requer autenticação (current_user no contexto).
module Mutations
  class CreateReview < Mutations::BaseMutation
    description 'Cria uma avaliação para uma empresa (requer autenticação)'

    # Campos de retorno
    field :review, Types::ReviewType, null: true
    field :errors, [String], null: false

    # Campos de entrada
    argument :company_id, ID, required: true
    argument :category_id, ID, required: true
    argument :rating, Float, required: true
    argument :comment, String, required: false
    argument :headline, String, required: false
    argument :project_type, String, required: false
    argument :installation_status, String, required: false

    def resolve(
      company_id:, category_id:, rating:,
      comment: nil, headline: nil,
      project_type: nil, installation_status: nil
    )
      # Mutation de escrita requer autenticação
      unless context[:current_user]
        return { review: nil, errors: ['Autenticação necessária para avaliar uma empresa'] }
      end

      current_user = context[:current_user]

      # Valida empresa
      company = Company.active.find_by(id: company_id)
      unless company
        return { review: nil, errors: ['Empresa não encontrada ou inativa'] }
      end

      # Valida nota
      unless (1.0..5.0).cover?(rating.to_f)
        return { review: nil, errors: ['Nota deve estar entre 1 e 5'] }
      end

      review_attrs = {
        user_id: current_user.id,
        company_id: company.id,
        category_id: category_id,
        rating: rating.to_f,
        is_legacy: false,
        metadata: { reviewer_email: current_user.email, origin: 'graphql' }
      }

      review_attrs[:comment] = comment if comment.present?
      review_attrs[:headline] = headline if headline.present?
      review_attrs[:project_type] = project_type if project_type.present?
      review_attrs[:installation_status] = installation_status if installation_status.present?

      review = Review.new(review_attrs)

      if review.save
        # Moderação automática (mesmo fluxo do REST)
        begin
          Reviews::ModerationService.new.evaluate(review)
        rescue StandardError => e
          Rails.logger.error("[GraphQL] Moderation error for review #{review.id}: #{e.message}")
        end

        # Analytics
        begin
          Analytics::PostHogService.capture(
            'review_submitted',
            { review_id: review.id, company_id: company.id, rating: review.rating.to_f, origin: 'graphql' }.compact,
            distinct_id: current_user.respond_to?(:posthog_distinct_id) ? current_user.posthog_distinct_id : current_user.id.to_s
          )
        rescue StandardError => e
          Rails.logger.warn("[GraphQL] Analytics error on review creation: #{e.message}")
        end

        { review: review.reload, errors: [] }
      else
        { review: nil, errors: review.errors.full_messages }
      end
    rescue ActiveRecord::RecordNotUnique
      { review: nil, errors: ['Você já avaliou esta empresa nesta categoria.'] }
    rescue StandardError => e
      Rails.logger.error("[GraphQL CreateReview] #{e.class}: #{e.message}")
      { review: nil, errors: ['Erro interno ao criar avaliação'] }
    end
  end
end
