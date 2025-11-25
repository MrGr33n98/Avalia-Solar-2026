class Api::V1::LeadsController < Api::V1::BaseController
  before_action :set_lead, only: %i[show update destroy]

  def index
    @leads = Lead.all
    render json: @leads
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: @lead
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Lead não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def create
    @lead = Lead.new(lead_params)

    if @lead.save
      render json: @lead, status: :created
    else
      render json: { errors: @lead.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def update
    if @lead.update(lead_params)
      render json: @lead
    else
      render json: { errors: @lead.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Lead não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def destroy
    @lead.destroy
    render json: { message: 'Lead excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Lead não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  private

  def set_lead
    @lead = Lead.find(params[:id])
  end

  def lead_params
    params.require(:lead).permit(:name, :email, :phone, :company, :message)
  end
end
