class Api::V1::PlansController < Api::V1::BaseController
  before_action :set_plan, only: %i[show update destroy]

  def index
    @plans = Plan.all
    render json: @plans
  rescue StandardError => e
    Rails.logger.error("Plans error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: @plan
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Plano não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Plans error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def create
    @plan = Plan.new(plan_params)

    if @plan.save
      render json: @plan, status: :created
    else
      render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Plans error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def update
    if @plan.update(plan_params)
      render json: @plan
    else
      render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Plano não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Plans error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def destroy
    @plan.destroy
    render json: { message: 'Plano excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Plano não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Plans error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  private

  def set_plan
    @plan = Plan.find(params[:id])
  end

  def plan_params
    params.require(:plan).permit(:name, :description, :price, :features)
  end
end
