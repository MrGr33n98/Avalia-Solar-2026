class Api::V1::LeadsController < Api::V1::BaseController
  before_action :set_lead, only: %i[show update destroy]

  def index
    @leads = Lead.all
    
    # Check if status column exists before filtering
    if params[:status].present? && Lead.column_names.include?('status')
      @leads = @leads.where(status: params[:status])
    end
    
    if params[:company_id].present? || params[:company_name].present?
      cid = params[:company_id].presence && params[:company_id].to_i
      cname = params[:company_name].presence

      company_id_supported = Lead.column_names.include?('company_id')

      if cid && cname && company_id_supported
        @leads = @leads.where('(company_id = ? OR company = ?)', cid, cname)
      elsif cid && company_id_supported
        @leads = @leads.where(company_id: cid)
      elsif cname
        @leads = @leads.where(company: cname)
      end
    end
    
    # Only order by created_at if the column exists
    if Lead.column_names.include?('created_at')
      @leads = @leads.order(created_at: :desc)
    end
    
    render json: @leads
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render json: [], status: :ok
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
    if Lead.column_names.include?('company') && params[:lead].is_a?(ActionController::Parameters) && params[:lead][:company].present?
      @lead[:company] = params[:lead][:company]
    end

    if @lead.save
      render json: @lead, status: :created
    else
      render json: { errors: @lead.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActionController::ParameterMissing => e
    render json: { error: e.message }, status: :bad_request
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
    base_keys = [:name, :email, :phone, :message]
    optional_keys = []
    columns = Lead.column_names
    optional_keys << :project_type if columns.include?('project_type')
    optional_keys << :estimated_budget if columns.include?('estimated_budget')
    optional_keys << :location if columns.include?('location')
    optional_keys << :company_id if columns.include?('company_id')
    params.require(:lead).permit(*(base_keys + optional_keys))
  end
end
