# app/controllers/api/v1/reviews_controller.rb
class Api::V1::ReviewsController < Api::V1::BaseController
  before_action :set_review, only: %i[show update destroy]

  def index
    # Eager load associations to prevent N+1 queries
    @reviews = Review.includes(:user)
                     .order(created_at: :desc)

    # Filtra por company_id se fornecido
    if params[:company_id].present?
      company_id = params[:company_id].to_i
      @reviews = @reviews.where(company_id: company_id)
    end

    # Add a limit to avoid sending too much data
    @reviews = @reviews.limit(params[:limit].present? ? params[:limit].to_i : 10)

    # Render a custom JSON response that includes associated data
    render json: @reviews, include: {
      user: { only: %i[id name] }
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Registros não encontrados' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Erro ao buscar reviews: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: @review, include: {
      user: { only: %i[id name] }
    }
  end

  def create
    @review = Review.new(review_params)

    if @review.save
      render json: @review, status: :created
    else
      render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @review.update(review_params)
      render json: @review
    else
      render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @review.destroy
    head :no_content
  end

  private

  def set_review
    @review = Review.find(params[:id])
  end

  def review_params
    params.require(:review).permit(:rating, :comment, :user_id, :company_id)
  end
end
