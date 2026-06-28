module Api
  module V1
    module Admin
      class ReviewsController < ::Api::V1::BaseController
        before_action :authenticate_admin_user!
        before_action :set_review, only: %i[show approve reject flag]

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

        def pending
          reviews = Review.includes(:company, :user).where(status: Review.statuses[:pending]).order(created_at: :desc)

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

        def flag
          execute_decision(:flag)
        end

        private

        def execute_decision(action)
          service = Reviews::DecisionService.new
          service.public_send("#{action}!", @review)

          render json: serialized_review(@review)
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
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
