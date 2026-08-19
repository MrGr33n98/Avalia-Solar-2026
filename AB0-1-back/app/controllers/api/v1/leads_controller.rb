# frozen_string_literal: true

require 'json'
require 'uri'

class Api::V1::LeadsController < Api::V1::BaseController
  include FeatureGateEnforceable

  ALLOWED_UTM_KEYS = %w[utm_source utm_medium utm_campaign utm_content utm_term gclid fbclid msclkid].freeze
  IDENTITY_KEYS = %w[anonymous_id session_id].freeze
  class EmailDeliveryFailed < StandardError
  end

  before_action :set_lead, only: %i[show update destroy send_otp resend_otp verify_otp wizard_result]
  before_action :authenticate_api_user, only: %i[index show update destroy mine]
  before_action :ensure_leads_access!, only: %i[index]
  before_action :ensure_leads_feature_access!, only: %i[index]
  before_action :ensure_lead_access!, only: %i[show update destroy]
  before_action :check_honeypot, only: %i[create wizard_create]

  def index
    @leads = scoped_leads
    Rails.logger.info("[Leads#index] User: #{current_user&.id}, Company: #{current_user&.company_id}, Scoped Leads Count: #{@leads&.count}")
    return if performed? || @leads.nil?

    @leads = @leads.where(status: params[:status]) if params[:status].present? && ::Lead.column_names.include?('status')

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

    @leads = @leads.order(created_at: :desc) if ::Lead.column_names.include?('created_at')
    render json: @leads
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro ao listar leads',
                          status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def mine
    start_time = Time.current
    return render json: { error: 'Authentication required' }, status: :unauthorized if current_user.nil?

    @leads = ::Lead.where(email: current_user.email).order(created_at: :desc)

    duration_ms = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info({
      event: 'api_performance',
      endpoint: 'leads#mine',
      duration_ms: duration_ms,
      user_id: current_user.id,
      count: @leads.count,
      timestamp: Time.current.iso8601
    }.to_json)

    render json: {
      data: @leads.map { |l| serialize_lead(l) },
      meta: { page: 1, total_pages: 1, total_count: @leads.count }
    }
  rescue StandardError => e
    Rails.logger.error("Leads mine error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro ao listar seus orçamentos',
                          status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def serialize_lead(lead)
    {
      id: lead.id,
      company: {
        id: lead.company_id,
        name: lead.company || 'Empresa não identificada',
        logo_url: lead.company_id ? lead.company&.logo_url : nil
      },
      category: lead.product_vertical,
      status: lead.wizard_status,
      created_at: lead.created_at
    }
  end

  def show
    render json: @lead
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Lead não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor',
                          status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def create
    @lead = ::Lead.new(lead_params)
    if @edge_location.present?
      @lead.city = @edge_location[:city] if @lead.respond_to?(:city) && @lead.city.blank?
      @lead.state = @edge_location[:state] if @lead.respond_to?(:state) && @lead.state.blank?
    end
    if ::Lead.column_names.include?('company') && params[:lead].is_a?(ActionController::Parameters) && params[:lead][:company].present?
      @lead[:company] = params[:lead][:company]
    end
    utm_data = extract_utm_payload
    attribution = sanitize_attribution_payload(params[:attribution] || params.dig(:lead, :attribution))
    apply_utm_to_lead(@lead, utm_data, attribution)
    if @lead.save
      persist_identity_on_lead!(@lead)
      LeadRoutingJob.perform_later(@lead.id) if ENV.fetch('LEAD_MARKETPLACE_V1', 'true') == 'true'
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

  # Resilient wizard creation using LeadWizard::Creator
  def wizard_create
    result = LeadWizard::Creator.new(
      params.to_unsafe_h,
      preferred_company_id: params[:preferred_company_id],
      edge_location: @edge_location,
      remote_ip: request.remote_ip
    ).call

    if result[:success]
      lead = result[:lead]
      persist_identity_on_lead!(lead)
      identity_metadata = identity_tracking_metadata(lead)
      otp_code = lead.generate_otp!
      log_otp_code(lead, otp_code)
      deliver_otp_email!(lead, otp_code)

      Analytics::TrackEventService.call(
        event_type: 'lead_initiated',
        company_id: lead.company_id,
        metadata: request_metadata.merge(identity_metadata).merge(
          lead_id: lead.id,
          template_key: lead.template_key,
          template_version: lead.template_version
        )
      )

      Analytics::PostHogService.capture(
        'wizard_contact_submitted',
        {
          lead_id: lead.id,
          company_id: lead.company_id,
          category_id: lead.respond_to?(:product_vertical) ? lead.product_vertical : nil,
          template_key: lead.respond_to?(:template_key) ? lead.template_key : nil
        }.compact,
        distinct_id: current_user&.posthog_distinct_id || "anon_lead_#{lead.id}"
      )

      render json: {
        lead_id: lead.id,
        status: lead.wizard_status,
        otp_sent_at: lead.otp_sent_at,
        verification_channel: 'email',
        email_hint: mask_email(lead.email)
      }, status: :created
    elsif result[:error] == 'internal_error'
      render json: { error: 'Internal Server Error', message: result[:message] }, status: :internal_server_error
    else
      render json: { error: 'validation_failed', fields: result[:errors] }, status: :unprocessable_entity
    end
  rescue EmailDeliveryFailed => e
    Rails.logger.error("Leads wizard_create email delivery error: #{e.message}")
    render json: {
      error: 'Nao conseguimos enviar o codigo de verificacao. Tente novamente em instantes.',
      code: 'EMAIL_DELIVERY_FAILED'
    }, status: :service_unavailable
  rescue StandardError => e
    Rails.logger.error("Leads wizard_create critical error: #{e.class} - #{e.message}\n#{e.backtrace.first(5).join("\n")}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def send_otp
    return render json: { error: 'Lead not found' }, status: :not_found if @lead.nil?
    if @lead.otp_verified_at.present?
      return render json: { error: 'Verification code already confirmed' }, status: :unprocessable_entity
    end

    unless @lead.otp_can_resend?
      retry_in = ::Lead::OTP_RESEND_COOLDOWN - (Time.current - @lead.otp_sent_at)
      return render json: { error: 'Verification code recently sent', retry_in: retry_in.to_i },
                    status: :too_many_requests
    end
    otp_code = @lead.generate_otp!
    log_otp_code(@lead, otp_code)
    deliver_otp_email!(@lead, otp_code)
    render json: {
      lead_id: @lead.id,
      otp_sent_at: @lead.otp_sent_at,
      verification_channel: 'email',
      email_hint: mask_email(@lead.email)
    }, status: :ok
  rescue EmailDeliveryFailed => e
    Rails.logger.error("Leads send_otp email delivery error: #{e.message}")
    render json: {
      error: 'Nao conseguimos reenviar o codigo de verificacao. Tente novamente em instantes.',
      code: 'EMAIL_DELIVERY_FAILED'
    }, status: :service_unavailable
  rescue StandardError => e
    Rails.logger.error("Leads send_otp error: #{e.message}")
    render json: { error: 'Unable to send verification email' }, status: :internal_server_error
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
      return render json: { error: 'Verification attempts exceeded' }, status: :unprocessable_entity
    end
    return render json: { error: 'Verification code expired' }, status: :unprocessable_entity if @lead.otp_expired?

    otp_code = params[:otp_code].presence || params.dig(:lead, :otp_code)
    return render json: { error: 'Verification code is required' }, status: :unprocessable_entity if otp_code.blank?

    unless @lead.valid_otp?(otp_code)
      @lead.increment_otp_attempts!
      return render json: { error: 'Invalid verification code' }, status: :unprocessable_entity
    end
    companies = []
    persist_identity_on_lead!(@lead)
    identity_metadata = identity_tracking_metadata(@lead)
    ::Lead.transaction do
      @lead.update!(otp_verified_at: Time.current, wizard_status: 'verified')

      distinct_id = current_user&.id || "anon_lead_#{@lead.id}"

      # 1. OTP Verified
      Analytics::PostHogService.track_server_event(
        'otp_verified',
        distinct_id,
        { lead_id: @lead.id, auth_method: 'email' }
      )

      # 2. Lead Created (Successfully persisted and verified)
      Analytics::PostHogService.track_server_event(
        'lead_created',
        distinct_id,
        {
          lead_id: @lead.id,
          company_id: @lead.company_id,
          category_id: @lead.respond_to?(:product_vertical) ? @lead.product_vertical : nil
        }.compact
      )

      Analytics::TrackEventService.call(
        event_type: 'lead_verified',
        company_id: @lead.company_id,
        metadata: request_metadata.merge(identity_metadata).merge(lead_id: @lead.id)
      )

      preferred_company_id = params[:preferred_company_id].presence&.to_i || @lead.company_id
      if ENV.fetch('LEAD_MARKETPLACE_V1', 'true') == 'true'
        LeadRoutingJob.perform_later(@lead.id, preferred_company_id)
      else
        companies = LeadDistributionService.new(@lead, preferred_company_id: preferred_company_id).call
        @lead.update!(wizard_status: 'distributed') if companies.any?
      end

      # 3. Lead Dispatched (One event per recipient as per V2)
      companies.each do |comp|
        Analytics::PostHogService.track_server_event(
          'lead_dispatched',
          distinct_id,
          { lead_id: @lead.id, recipient_id: comp.id }
        )
      end

      Analytics::TrackEventService.call(
        event_type: 'lead_distributed',
        company_id: @lead.company_id,
        metadata: request_metadata.merge(identity_metadata).merge(
          lead_id: @lead.id,
          distributed_to_count: companies.count,
          company_ids: companies.map(&:id)
        )
      )
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
      render_error_response(error: 'Unprocessable Entity', message: 'Não foi possível atualizar o lead',
                            status: :unprocessable_entity, code: 'UNPROCESSABLE_ENTITY', details: @lead.errors.full_messages)
    end
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Lead não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor',
                          status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def destroy
    @lead.destroy
    render json: { message: 'Lead excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Lead não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Leads error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor',
                          status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  private

  def set_lead
    @lead = ::Lead.find(params[:id])
  end

  def scoped_leads
    return ::Lead.all if current_user&.admin?

    if current_user&.company_user? && current_user.company_id.present?
      company = current_user.company
      unless company_active?(company)
        render_error_response(error: 'Forbidden', message: 'Company account is not active', status: :forbidden,
                              code: 'COMPANY_INACTIVE')
        return nil
      end
      return ::Lead.where(company_id: current_user.company_id)
    end
    render_error_response(error: 'Forbidden', message: 'Not authorized to list leads', status: :forbidden,
                          code: 'FORBIDDEN')
    nil
  end

  def ensure_leads_access!
    return if performed? || current_user.nil?

    scoped_leads
  end

  def ensure_leads_feature_access!
    return if performed? || current_user&.admin?

    enforce_feature_access!(:leads_marketplace, company: current_user&.company)
  end

  def ensure_lead_access!
    return if performed? || current_user.nil?
    return if current_user&.admin?

    if current_user&.company_user? && current_user.company_id.present?
      company = current_user.company
      unless company_active?(company)
        render_error_response(error: 'Forbidden', message: 'Company account is not active', status: :forbidden,
                              code: 'COMPANY_INACTIVE')
        return
      end
      return if @lead.company_id == current_user.company_id
    end
    render_error_response(error: 'Forbidden', message: 'Not authorized to access this lead', status: :forbidden,
                          code: 'FORBIDDEN')
  end

  def lead_params
    base_keys = %i[name email phone message]
    optional_keys = []
    columns = ::Lead.column_names
    optional_keys << :project_type if columns.include?('project_type')
    optional_keys << :estimated_budget if columns.include?('estimated_budget')
    optional_keys << :location if columns.include?('location')
    allow_company_assignment = action_name == 'create' || current_user&.admin?
    optional_keys << :company_id if columns.include?('company_id') && allow_company_assignment
    params.require(:lead).permit(*(base_keys + optional_keys), :nickname)
  end

  def check_honeypot
    return if params.dig(:lead, :nickname).blank?

    render_error_response(error: 'Unprocessable Entity', message: 'Spam detected', status: :unprocessable_entity,
                          code: 'SPAM_DETECTED')
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

  def company_active?(company)
    return false unless company
    return company.active_status? if company.respond_to?(:active_status?)

    company.status.to_s == 'active'
  end

  def extract_utm_payload
    raw = params[:utm] || params.dig(:lead, :utm)
    return {} unless raw.is_a?(Hash) || raw.is_a?(ActionController::Parameters)

    raw.to_unsafe_h.stringify_keys.slice(*ALLOWED_UTM_KEYS).transform_values { |v| sanitize_utm_value(v) }.compact
  end

  def sanitize_attribution_payload(raw)
    return nil unless raw.is_a?(Hash) || raw.is_a?(ActionController::Parameters)

    data = raw.to_unsafe_h
    touches = {}
    %w[first_touch last_touch].each do |key|
      touch = data[key] || data[key.to_sym]
      next unless touch.is_a?(Hash)

      values = sanitize_utm_hash(touch['values'] || touch[:values] || {})
      touch_payload = {
        values: values,
        landing_path: strip_path(touch['landing_path'] || touch[:landing_path]),
        referrer_host: strip_host(touch['referrer_host'] || touch[:referrer_host]),
        ts: touch['ts'] || touch[:ts]
      }.compact
      touches[key] = touch_payload if touch_payload.present?
    end
    ttl = data['ttl_days'] || data[:ttl_days]
    touches['ttl_days'] = ttl if ttl
    touches.presence
  end

  def sanitize_utm_hash(hash)
    return {} unless hash.is_a?(Hash)

    hash.stringify_keys.slice(*ALLOWED_UTM_KEYS).transform_values { |v| sanitize_utm_value(v) }.compact
  end

  def sanitize_utm_value(val)
    return nil if val.blank?

    val.to_s.downcase.strip.gsub(/[^a-z0-9_.-]/, '')[0, 255]
  end

  def strip_path(path)
    return nil if path.blank?

    uri = begin
      URI.parse(path)
    rescue StandardError
      nil
    end
    uri&.path.presence || path
  end

  def strip_host(ref)
    return nil if ref.blank?

    uri = begin
      URI.parse(ref)
    rescue StandardError
      nil
    end
    uri&.host || ref
  end

  def apply_utm_to_lead(lead, utm_data, attribution)
    return if lead.nil?

    utm_data.each do |key, value|
      next if value.blank?

      lead.send("#{key}=", value) if lead.respond_to?("#{key}=")
    end
    return unless attribution.present?

    landing = attribution.dig('last_touch', 'landing_path') || attribution.dig(:last_touch, :landing_path)
    ref_host = attribution.dig('last_touch', 'referrer_host') || attribution.dig(:last_touch, :referrer_host)
    lead.landing_path = strip_path(landing) if lead.respond_to?(:landing_path=)
    lead.referrer_host = strip_host(ref_host) if lead.respond_to?(:referrer_host=)
    lead.attribution_json = attribution if lead.respond_to?(:attribution_json=)
  end

  def log_otp_code(lead, code)
    return unless Rails.env.development? || Rails.env.test?

    Rails.logger.info("OTP for lead #{lead.id}: #{code}")
  end

  def deliver_otp_email!(lead, code)
    raise ArgumentError, 'Lead e-mail is required for verification' if lead.email.blank?
    if ActionMailer::Base.delivery_method.to_sym == :test && !(Rails.env.test? || Rails.env.development?)
      raise 'E-mail delivery is disabled because ActionMailer is using the test delivery method'
    end

    LeadVerificationMailer.verification_code(lead.id, code).deliver_now
  rescue StandardError => e
    Rails.logger.error("OTP e-mail delivery failed for lead #{lead.id}: #{e.class} - #{e.message}")
    raise EmailDeliveryFailed, e.message
  end

  def mask_email(email)
    return nil if email.blank?

    local_part, domain = email.split('@', 2)
    return email if local_part.blank? || domain.blank?
    return email if local_part.length <= 2

    "#{local_part[0, 2]}***@#{domain}"
  end

  def identity_tracking_metadata(lead = nil)
    data = {}
    IDENTITY_KEYS.each do |key|
      candidate =
        identity_param(key) ||
        lead_identity_value(lead, key) ||
        identity_cookie_value(key)

      data[key.to_sym] = sanitize_identity_value(candidate) if candidate.present?
    end
    data.compact
  end

  def persist_identity_on_lead!(lead)
    return if lead.nil?

    identity = identity_tracking_metadata(lead)
    return if identity.blank?

    wizard_answers = normalize_json_hash(lead.respond_to?(:wizard_answers) ? lead.wizard_answers : {})
    attribution = normalize_json_hash(lead.respond_to?(:attribution_json) ? lead.attribution_json : {})

    changed = false
    identity.each do |key, value|
      string_key = key.to_s

      if wizard_answers[string_key].blank?
        wizard_answers[string_key] = value
        changed = true
      end

      if attribution[string_key].blank?
        attribution[string_key] = value
        changed = true
      end
    end

    return unless changed

    attrs = {}
    attrs[:wizard_answers] = wizard_answers if lead.respond_to?(:wizard_answers)
    attrs[:attribution_json] = attribution if lead.respond_to?(:attribution_json)
    attrs[:updated_at] = Time.current if lead.respond_to?(:updated_at)

    lead.update_columns(attrs) if attrs.any?
  rescue StandardError => e
    Rails.logger.warn("[LeadsController] Failed to persist lead identity lead_id=#{lead&.id}: #{e.class}: #{e.message}")
  end

  def lead_identity_value(lead, key)
    return nil if lead.nil?

    answers = normalize_json_hash(lead.respond_to?(:wizard_answers) ? lead.wizard_answers : {})
    attribution = normalize_json_hash(lead.respond_to?(:attribution_json) ? lead.attribution_json : {})
    answers[key.to_s].presence || attribution[key.to_s].presence
  end

  def identity_param(key)
    params[key].presence ||
      params.dig(:lead, key).presence ||
      params.dig(:metadata, key).presence ||
      params.dig(:attribution, key).presence ||
      params.dig(:lead, :attribution, key).presence
  end

  def identity_cookie_value(key)
    case key.to_s
    when 'anonymous_id'
      cookies[:anonymous_id]
    when 'session_id'
      cookies.signed[:as_sid]
    end
  end

  def sanitize_identity_value(value)
    candidate = value.to_s.strip
    return nil if candidate.blank?

    candidate[0, 255]
  end

  def normalize_json_hash(value)
    case value
    when Hash
      value.deep_stringify_keys
    when String
      parsed = JSON.parse(value)
      parsed.is_a?(Hash) ? parsed.deep_stringify_keys : {}
    else
      {}
    end
  rescue JSON::ParserError
    {}
  end
end
