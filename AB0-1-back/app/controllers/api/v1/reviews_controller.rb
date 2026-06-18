# app/controllers/api/v1/reviews_controller.rb
class Api::V1::ReviewsController < Api::V1::BaseController
  before_action :set_review, only: %i[show update destroy]
  before_action :authenticate_api_user, only: %i[create update destroy mine]
  before_action :ensure_owner, only: %i[destroy]

  def index
    # Eager load associations to prevent N+1 queries
    @reviews = Review.includes(:user, :company, review_criterion_scores: :rating_criterion)
                     .order(created_at: :desc)

    # Filtra por company_id se fornecido
    @reviews = @reviews.where(company_id: params[:company_id].to_i) if params[:company_id].present?

    @reviews = @reviews.where(user_id: params[:user_id].to_i) if params[:user_id].present?

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

    render json: @reviews.map { |review| serialize_review(review) }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Registros não encontrados' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Erro ao buscar reviews: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: serialize_review(@review)
  end

  def mine
    @reviews = current_user.reviews.includes(:user, :company, review_criterion_scores: :rating_criterion).order(created_at: :desc)
    render json: {
      data: @reviews.map { |r| serialize_review(r) }
    }
  end

  def create
    # Persiste o e-mail no metadata para facilitar auditoria futura e buscas rápidas
    permitted_review_params = review_params
    metadata_with_email = (permitted_review_params[:metadata] || {}).merge(reviewer_email: current_user.email)
    
    @review = Review.new(permitted_review_params.merge(
      user_id: current_user.id, 
      is_legacy: false,
      capture_flow_source: permitted_review_params[:capture_flow_source].presence || 'profile',
      metadata: metadata_with_email
    ))

    if @review.save
      begin
        Reviews::ModerationService.new.evaluate(@review)
      rescue StandardError => e
        Rails.logger.error("Failed to run moderation service for review #{@review.id}: #{e.message}")
      end

      # ... Track event e Notificações ...
      Analytics::PostHogService.capture(
        'review_submitted',
        {
          review_id: @review.id,
          company_id: @review.company_id,
          category_id: @review.category_id,
          rating: @review.rating.to_f,
          project_type: @review.project_type
        }.compact,
        distinct_id: current_user.posthog_distinct_id
      )
      render json: serialize_review(@review.reload), status: :created
    else
      # Validação rails já capturou a regra [user_id OR email, company_id, category_id]
      render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotUnique => e
    # Caso a validação de aplicação falhe por concorrência, os índices do banco idx_reviews_user_company_category_v2
    # e idx_reviews_legacy_global_uniqueness garantem a unicidade física no DB.
    render json: { errors: ['Você já avaliou esta empresa nesta categoria.'] }, status: :unprocessable_entity
  end

  def update
    if @review.user_id == current_user.id
      # User updating their own review
      if @review.update(review_params)
        render json: serialize_review(@review.reload)
      else
        render json: { errors: @review.errors.full_messages }, status: :unprocessable_entity
      end
    elsif current_user.company_user? && current_user.active_membership_for?(@review.company_id)
      # Company replying to a review
      if @review.update(reply_params.merge(replied_at: Time.current))
        # Notify review author
        ReviewNotifier.with(review: @review, type: :reply).deliver(@review.user)

        render json: serialize_review(@review.reload)
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
      rating: review.rating.to_f,
      comment: review.comment,
      headline: review.headline,
      pros: review.pros,
      cons: review.cons,
      buyer_tip: review.buyer_tip,
      user_id: review.user_id,
      company_id: review.company_id,
      category_id: review.category_id,
      status: review.status,
      project_type: review.project_type,
      installation_status: review.installation_status,
      estimated_power: review.estimated_power.to_f,
      is_legacy: review.is_legacy,
      project_context: review.project_context,
      created_at: review.created_at,
      updated_at: review.updated_at,
      reply: review.reply,
      replied_at: review.replied_at,
      featured: review.featured,
      display_order: review.display_order,
      verified: review.verified,
      user: serialize_user(review.user),
      company: serialize_company(review.company),
      granular_scores: serialize_granular_scores(review)
    }
  end

  def serialize_granular_scores(review)
    # Tenta usar o snapshot JSONB se disponível (Phase 2)
    return review.granular_scores_snapshot if review.granular_scores_snapshot.present?

    # Fallback para consulta SQL (Reviews legadas ou recém-criadas sem snapshot persistido ainda)
    serialize_review_criterion_scores(review)
  end

  def serialize_review_criterion_scores(review)
    review.review_criterion_scores.includes(:rating_criterion).map do |score|
      {
        id: score.id,
        score: score.score.to_f,
        not_applicable: score.not_applicable,
        rating_criterion_id: score.rating_criterion_id,
        title: score.title_snapshot || score.rating_criterion&.title,
        weight: score.weight_snapshot || score.rating_criterion&.weight
      }
    end
  rescue StandardError => e
    Rails.logger.warn("[ReviewsController] failed to serialize criterion scores for review #{review.id}: #{e.message}")
    []
  end

  def set_review
    @review = Review.includes(:user, :company, review_criterion_scores: :rating_criterion).find(params[:id])
  end

  def review_params
    # Aceita os campos editoriais como colunas físicas e project_context como JSONB
    params.require(:review).permit(
      :rating, :comment, :company_id, :category_id, :headline, :buyer_tip,
      :project_type, :installation_status, :estimated_power, :capture_flow_source,
      { pros: [] }, { cons: [] }, { project_context: {} }, { metadata: {} },
      review_criterion_scores_attributes: %i[id rating_criterion_id score not_applicable _destroy]
    )
  end

  def reply_params
    params.require(:review).permit(:reply, :status)
  end

  def duplicate_review_constraint_v2?(error)
    msg = error.message.to_s
    msg.include?('idx_reviews_user_company_category_v2') || 
    msg.include?('idx_reviews_legacy_global_uniqueness') ||
    msg.include?('index_reviews_on_company_id_and_user_id')
  end

  def ensure_owner
    return unless @review.user_id != current_user.id

    Rails.logger.warn("[AccessDenied] user #{current_user.id} tried to modify review #{params[:id]} owned by #{@review.user_id}")
    render json: { error: 'Forbidden' }, status: :forbidden
  end

  def serialize_user(user)
    return nil unless user

    {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url
    }
  end

  def serialize_company(company)
    return nil unless company

    {
      id: company.id,
      name: company.name,
      logo_url: company.logo_url,
      slug: company.slug
    }
  end

  def serialize_review_criterion_score(score)
    {
      id: score.id,
      score: score.score.to_f,
      not_applicable: score.not_applicable,
      rating_criterion_id: score.rating_criterion_id,
      title: score.title_snapshot || score.rating_criterion&.title,
      weight: score.weight_snapshot || score.rating_criterion&.weight
    }
  end
end
