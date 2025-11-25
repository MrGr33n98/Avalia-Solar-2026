class Api::V1::CampaignReviewsController < Api::V1::BaseController
  before_action :set_campaign_review, only: %i[show update destroy]

  def index
    scope = CampaignReview.includes(:company, :product, :campaign).order(created_at: :desc)
    scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
    scope = scope.where(product_id: params[:product_id]) if params[:product_id].present?
    scope = scope.sponsored if ActiveModel::Type::Boolean.new.cast(params[:sponsored])
    render json: scope, each_serializer: CampaignReviewSerializer
  rescue StandardError => e
    Rails.logger.error("CampaignReviews#index error: #{e.message}")
    render json: { error: 'Erro interno' }, status: :internal_server_error
  end

  def show
    render json: @campaign_review, serializer: CampaignReviewSerializer
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Registro não encontrado' }, status: :not_found
  end

  def create
    @campaign_review = CampaignReview.new(cr_params)
    if @campaign_review.save
      render json: @campaign_review, status: :created
    else
      render json: { errors: @campaign_review.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("CampaignReviews#create error: #{e.message}")
    render json: { error: 'Erro interno' }, status: :internal_server_error
  end

  def update
    if @campaign_review.update(cr_params)
      render json: @campaign_review
    else
      render json: { errors: @campaign_review.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("CampaignReviews#update error: #{e.message}")
    render json: { error: 'Erro interno' }, status: :internal_server_error
  end

  def destroy
    @campaign_review.destroy
    head :no_content
  rescue StandardError => e
    Rails.logger.error("CampaignReviews#destroy error: #{e.message}")
    render json: { error: 'Erro interno' }, status: :internal_server_error
  end

  private

  def set_campaign_review
    @campaign_review = CampaignReview.find(params[:id])
  end

  def cr_params
    params.require(:campaign_review).permit(:title, :code, :member_id, :share_code,
                                            :goal, :achieved, :debutants, :shares, :prize,
                                            :start_at, :end_at, :company_id, :product_id,
                                            :sponsored)
  end
end
