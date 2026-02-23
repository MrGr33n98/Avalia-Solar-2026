# app/controllers/api/v1/reviews_controller.rb
class Api::V1::ReviewsController < Api::V1::BaseController
  before_action :set_review, only: %i[show update destroy]
  before_action :authenticate_api_user, only: %i[create update destroy mine]
  before_action :ensure_owner, only: %i[destroy]

  def index
    # Eager load associations to prevent N+1 queries
    @reviews = Review.includes(:user)
                     .order(created_at: :desc)

    # Filtra por company_id se fornecido
    if params[:company_id].present?
      company_id = params[:company_id].to_i
      @reviews = @reviews.where(company_id: company_id)
    end

    # Filtra por reviews do usuário autenticado, se solicitado
    if ActiveModel::Type::Boolean.new.cast(params[:mine])
      return if authenticate_api_user == false
      @reviews = @reviews.where(user_id: current_user.id)
    end
    
    # Filtra por status se fornecido (útil para dashboards)
    if params[:status].present?
      @reviews = @reviews.where(status: params[:status])
    elsif !ActiveModel::Type::Boolean.new.cast(params[:mine])
      @reviews = @reviews.where(status: Review.statuses[:approved])
    end

    # Add a limit to avoid sending too much data
    @reviews = @reviews.limit(params[:limit].present? ? params[:limit].to_i : 10)

    # Render a custom JSON response that includes associated data
    render json: @reviews, include: {
      user: { only: %i[id name], methods: [:avatar_url] },
      company: { only: %i[id name logo_url slug] }
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

  def mine
    @reviews = current_user.reviews.includes(:company).order(created_at: :desc)
    render json: {
      data: @reviews.map { |r| serialize_review(r) }
    }
  end

  def create
    @review = Review.new(review_params.merge(user_id: current_user.id))

    if @review.save
      # Track event
      Analytics::TrackEventService.call(
        company_id: @review.company_id,
        user: current_user,
        event_type: 'review_created',
        metadata: request_metadata.merge(
          rating: @review.rating,
          comment_length: @review.comment&.length
        )
      )

      # Notify company owners
      owners = @review.company.company_members.owner.includes(:user).map(&:user)
      ReviewNotifier.with(review: @review, type: :new_review).deliver(owners) if owners.any?

      render json: @review, status: :created
    else
      render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @review.user_id == current_user.id
      # User updating their own review
      if @review.update(review_params)
        render json: @review
      else
        render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
      end
    elsif current_user.company_user? && current_user.active_membership_for?(@review.company_id)
      # Company replying to a review
      if @review.update(reply_params.merge(replied_at: Time.current))
        # Notify review author
        ReviewNotifier.with(review: @review, type: :reply).deliver(@review.user)

        render json: @review
      else
        render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end

  def destroy
    @review.destroy
    head :no_content
  end

  private

  def serialize_review(review)
    {
      id: review.id,
      company: {
        id: review.company.id,
        name: review.company.name,
        logo_url: review.company.logo_url
      },
      rating: review.rating,
      body: review.comment,
      status: review.status,
      created_at: review.created_at
    }
  end

  def set_review
    @review = Review.find(params[:id])
  end

  def review_params
    params.require(:review).permit(:rating, :comment, :company_id)
  end

  def reply_params
    params.require(:review).permit(:reply, :status)
  end

  def ensure_owner
    if @review.user_id != current_user.id
      Rails.logger.warn("[AccessDenied] user #{current_user.id} tried to modify review #{params[:id]} owned by #{@review.user_id}")
      return render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
