module Api
  module V1
    module Admin
      class ReviewsController < ::Api::V1::BaseController
        before_action :authenticate_admin_user!
        before_action :set_review, only: %i[show approve reject]

        PAGE_SIZE = 25

        def index
          reviews = Review.includes(:company, :user).order(created_at: :desc)
          reviews = reviews.where(company_id: params[:company_id]) if params[:company_id].present?
          reviews = reviews.where(user_id: params[:user_id]) if params[:user_id].present?
          reviews = reviews.where(status: params[:status]) if params[:status].present?
          reviews = reviews.where(featured: to_boolean(params[:featured])) unless params[:featured].nil?

          limit = (params[:limit] || PAGE_SIZE).to_i
          limit = PAGE_SIZE if limit <= 0

          reviews = reviews.limit(limit)

          render json: {
            data: reviews.map { |review| serialized_review(review) },
            meta: { total_count: reviews.length }
          }
        end

        def show
          render json: serialized_review(@review)
        end

        def approve
          execute_decision(:approve)
        end

        def reject
          execute_decision(:reject)
        end

        private

        def execute_decision(action)
          service = ReviewDecisionService.new(
            review: @review,
            admin_user: current_admin_user,
            notes: params[:notes],
            lock_version: params[:lock_version]
          )

          service.public_send("#{action}!")
          render json: serialized_review(@review)
        rescue ReviewDecisionService::DecisionError => e
          render json: { error: e.message }, status: :conflict
        rescue ReviewDecisionService::PermissionError => e
          render json: { error: e.message }, status: :forbidden
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def serialized_review(review)
          ActiveModelSerializers::SerializableResource.new(
            review,
            serializer: ReviewSerializer
          ).as_json
        end

        def set_review
          @review = Review.find(params[:id])
        end

        def to_boolean(value)
          ActiveModel::Type::Boolean.new.cast(value)
        end

        def authenticate_admin_user!
          return if current_admin_user

          render json: { error: 'Unauthorized' }, status: :unauthorized
        end
      end
    end
  end
end
