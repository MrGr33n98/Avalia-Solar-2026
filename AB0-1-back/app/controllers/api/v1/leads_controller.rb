class Api::V1::LeadsController < Api::V1::BaseController
  before_action :set_lead, only: %i[show update destroy send_otp resend_otp verify_otp wizard_result]
  before_action :authenticate_api_user, only: %i[index show update destroy]
  before_action :ensure_leads_access!, only: %i[index]
  before_action :ensure_lead_access!, only: %i[show update destroy]

  def index
    @leads = scoped_leads
    return if performed? || @leads.nil?

    # Check if status column exists before filtering
    if params[:status].present? && ::Lead.column_names.include?('status')
      @leads = @leads.where(status: params[:status])
    end
    
    if current_user&.admin? && (params[:company_id].present? || params[:company_name].present?)
      cid = params[:company_id].presence && params[:company_id].to_i
      cname = params[:company_name].presence

      company_id_supported = ::Lead.column_names.include?('company_id')

      if cid && cname && company_id_supported
        @leads = @leads.where('(company_id = ? OR company = ?)', cid, cname)
      elsif cid && company_id_supported
        @leads = @leads.where(company_id: cid)
      elsif cname
        @leads = @leads.where(company: cname)
      end
    end
    
    # Only order by created_at if the column exists
    if ::Lead.column_names.include?('created_at')
      @leads = @leads.order(created_at: :desc)
    end
    
    render json: @leads
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render_error_response(
      error: 'Internal Server Error',
      message: 'Erro ao listar leads',
      status: :internal_server_error,
      code: 'INTERNAL_ERROR'
    )
  end

  def show
    render json: @lead
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Lead não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor', status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def create
    @lead = ::Lead.new(lead_params)
    
    # Injeta localização da borda (Cloudflare) se não fornecida
    if @edge_location.present?
      @lead.city = @edge_location[:city] if @lead.respond_to?(:city) && @lead.city.blank?
      @lead.state = @edge_location[:state] if @lead.respond_to?(:state) && @lead.state.blank?
    end

    if ::Lead.column_names.include?('company') && params[:lead].is_a?(ActionController::Parameters) && params[:lead][:company].present?
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

  def wizard_create
    payload = wizard_lead_params
    lead = ::Lead.new(payload.except(:full_name, :consent))
    
    # Injeta localização da borda (Cloudflare) se não fornecida
    if @edge_location.present?
      lead.city = @edge_location[:city] if lead.respond_to?(:city) && lead.city.blank?
      lead.state = @edge_location[:state] if lead.respond_to?(:state) && lead.state.blank?
    end

    lead.name = payload[:full_name] if lead.name.blank? && payload[:full_name].present?
    lead.wizard_status = 'pending_otp'
    lead.consent_at = Time.current if truthy?(payload[:consent])
    lead.consent_ip = request.remote_ip if lead.consent_at.present?
    lead.location = lead.address_full if lead.address_full.present?

    lead.bill_value = parse_decimal(lead.bill_value)
    lead.monthly_kwh = parse_decimal(lead.monthly_kwh)
    lead.system_size_band = normalize_system_size_band(
      lead.system_size_band,
      lead.bill_value,
      lead.monthly_kwh
    )

    preferred_company_id = params[:preferred_company_id].presence&.to_i
    if preferred_company_id.present? && ::Lead.column_names.include?('company_id')
      lead.company_id = preferred_company_id
    end

    if lead.save
      otp_code = lead.generate_otp!
      log_otp_code(lead, otp_code)
      render json: { lead_id: lead.id, otp_sent_at: lead.otp_sent_at }, status: :created
    else
      render json: { errors: lead.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActionController::ParameterMissing => e
    render json: { error: e.message }, status: :bad_request
  rescue StandardError => e
    Rails.logger.error("Leads wizard_create error: #{e.class} - #{e.message}\nBacktrace: #{e.backtrace.first(5).join("\n")}")
    render json: { error: 'Erro interno no servidor', details: e.message }, status: :internal_server_error
  end

  def send_otp
    return render json: { error: 'Lead not found' }, status: :not_found if @lead.nil?

    if @lead.otp_verified_at.present?
      return render json: { error: 'OTP already verified' }, status: :unprocessable_entity
    end

    unless @lead.otp_can_resend?
      retry_in = ::Lead::OTP_RESEND_COOLDOWN - (Time.current - @lead.otp_sent_at)
      return render json: { error: 'OTP recently sent', retry_in: retry_in.to_i }, status: :too_many_requests
    end

    otp_code = @lead.generate_otp!
    log_otp_code(@lead, otp_code)
    render json: { lead_id: @lead.id, otp_sent_at: @lead.otp_sent_at }, status: :ok
  rescue StandardError => e
    Rails.logger.error("Leads send_otp error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def resend_otp
    send_otp
  end

  def verify_otp
    return render json: { error: 'Lead not found' }, status: :not_found if @lead.nil?

    if @lead.otp_verified_at.present?
      companies = distributed_companies(@lead)
      return render json: { lead_id: @lead.id, companies: serialize_companies(companies) }, status: :ok
    end

    if @lead.otp_attempts_exceeded?
      return render json: { error: 'OTP attempts exceeded' }, status: :unprocessable_entity
    end

    if @lead.otp_expired?
      return render json: { error: 'OTP expired' }, status: :unprocessable_entity
    end

    otp_code = params[:otp_code].presence || params.dig(:lead, :otp_code)
    if otp_code.blank?
      return render json: { error: 'OTP code is required' }, status: :unprocessable_entity
    end

    unless @lead.valid_otp?(otp_code)
      @lead.increment_otp_attempts!
      return render json: { error: 'Invalid OTP' }, status: :unprocessable_entity
    end

    companies = []
    ::Lead.transaction do
      @lead.update!(otp_verified_at: Time.current, wizard_status: 'verified')
      preferred_company_id = params[:preferred_company_id].presence&.to_i || @lead.company_id
      companies = LeadDistributionService.new(@lead, preferred_company_id: preferred_company_id).call
      @lead.update!(wizard_status: 'distributed')
    end

    render json: { lead_id: @lead.id, companies: serialize_companies(companies) }, status: :ok
  rescue StandardError => e
    Rails.logger.error("Leads verify_otp error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def wizard_result
    companies = distributed_companies(@lead)
    render json: { lead_id: @lead.id, companies: serialize_companies(companies) }, status: :ok
  rescue StandardError => e
    Rails.logger.error("Leads wizard_result error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def update
    if @lead.update(lead_params)
      render json: @lead
    else
      render_error_response(
        error: 'Unprocessable Entity',
        message: 'Não foi possível atualizar o lead',
        status: :unprocessable_entity,
        code: 'UNPROCESSABLE_ENTITY',
        details: @lead.errors.full_messages
      )
    end
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Lead não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor', status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def destroy
    @lead.destroy
    render json: { message: 'Lead excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Lead não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor', status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  private

  def set_lead
    @lead = ::Lead.find(params[:id])
  end

  def scoped_leads
    return ::Lead.all if current_user&.admin?

    if current_user&.company_user? && current_user.company_id.present?
      company = current_user.company
      unless company&.active?
        render_error_response(
          error: 'Forbidden',
          message: 'Company account is not active',
          status: :forbidden,
          code: 'COMPANY_INACTIVE'
        )
        return nil
      end

      return ::Lead.where(company_id: current_user.company_id)
    end

    render_error_response(
      error: 'Forbidden',
      message: 'Not authorized to list leads',
      status: :forbidden,
      code: 'FORBIDDEN'
    )
    nil
  end

  def ensure_leads_access!
    return if performed? || current_user.nil?
    scoped_leads
  end

  def ensure_lead_access!
    return if performed? || current_user.nil?
    return if current_user&.admin?

    if current_user&.company_user? && current_user.company_id.present?
      company = current_user.company
      unless company&.active?
        render_error_response(
          error: 'Forbidden',
          message: 'Company account is not active',
          status: :forbidden,
          code: 'COMPANY_INACTIVE'
        )
        return
      end

      return if @lead.company_id == current_user.company_id
    end

    render_error_response(
      error: 'Forbidden',
      message: 'Not authorized to access this lead',
      status: :forbidden,
      code: 'FORBIDDEN'
    )
  end

  def lead_params
    base_keys = [:name, :email, :phone, :message]
    optional_keys = []
    columns = ::Lead.column_names
    optional_keys << :project_type if columns.include?('project_type')
    optional_keys << :estimated_budget if columns.include?('estimated_budget')
    optional_keys << :location if columns.include?('location')
    allow_company_assignment = action_name == 'create' || current_user&.admin?
    optional_keys << :company_id if columns.include?('company_id') && allow_company_assignment
    params.require(:lead).permit(*(base_keys + optional_keys))
  end

  def wizard_lead_params
    params.require(:lead).permit(
      :product_vertical,
      :project_profile,
      :quote_type,
      :system_size_band,
      :bill_value,
      :monthly_kwh,
      :decision_timeline,
      :address_full,
      :city,
      :state,
      :zipcode,
      :full_name,
      :email,
      :phone,
      :consent
    )
  end

  def distributed_companies(lead)
    lead.lead_distributions.includes(:company).map(&:company)
  end

  def serialize_companies(companies)
    companies.map do |company|
      {
        id: company.id,
        name: company.name,
        city: company.city,
        state: company.state,
        rating_avg: company.rating_avg,
        reviews_count: company.reviews_count,
        rating_count: company.rating_count,
        verified: company.verified,
        featured: company.featured,
        logo_url: company.logo_url
      }
    end
  end

  def normalize_system_size_band(choice, bill_value, monthly_kwh)
    return choice if choice.blank?

    normalized = I18n.transliterate(choice.to_s).downcase
    return choice unless normalized.include?('nao sei')

    return choice if bill_value.blank? && monthly_kwh.blank?

    if monthly_kwh.to_f >= 1200 || bill_value.to_f >= 1000
      '8 kWp ou mais'
    else
      'Ate 7 kWp'
    end
  end

  def parse_decimal(value)
    return value if value.is_a?(Numeric)
    return nil if value.blank?

    cleaned = value.to_s.tr(',', '.').gsub(/[^\d.]/, '')
    return nil if cleaned.blank?

    cleaned.to_f
  end

  def truthy?(value)
    %w[true 1 yes sim].include?(value.to_s.downcase)
  end

  def log_otp_code(lead, code)
    return unless Rails.env.development? || Rails.env.test?

    Rails.logger.info("OTP for lead #{lead.id}: #{code}")
  end
end
