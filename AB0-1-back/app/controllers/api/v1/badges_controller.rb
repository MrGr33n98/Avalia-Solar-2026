class Api::V1::BadgesController < Api::V1::BaseController
  before_action :set_badge, only: %i[show update destroy]

  def index
    @badges = Badge.all
    render json: @badges
  rescue StandardError => e
    Rails.logger.error("Badges error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: @badge
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Badge não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Badges error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def create
    @badge = Badge.new(badge_params)

    if @badge.save
      render json: @badge, status: :created
    else
      render json: { errors: @badge.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Badges error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def update
    if @badge.update(badge_params)
      render json: @badge
    else
      render json: { errors: @badge.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Badge não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Badges error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def destroy
    @badge.destroy
    render json: { message: 'Badge excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Badge não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Badges error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  private

  def set_badge
    @badge = Badge.find(params[:id])
  end

  def badge_params
    params.require(:badge).permit(:name, :description, :position, :year, :edition, :category_id, :products, :image)
  end
end
