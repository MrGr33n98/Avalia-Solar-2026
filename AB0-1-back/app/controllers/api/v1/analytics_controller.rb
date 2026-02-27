# frozen_string_literal: true

class Api::V1::AnalyticsController < Api::V1::BaseController
  before_action :authenticate_api_user, except: %i[track conversions events_track]
  ALLOW_ANONYMOUS_EVENTS = %w[page_view search web_vital].freeze

  # POST /api/v1/events/track
  def events_track
    if request.raw_post.to_s.strip.blank?
      return head :no_content
    end

    event_type = params[:event_name] || params[:event_type]
    company_id = params[:company_id]
    metadata = normalize_hash_param(params[:properties]) || normalize_hash_param(params[:metadata]) || {}
    
    return render json: { error: 'event_type is required' }, status: :bad_request if event_type.blank?

    # Handle session_id persistence
    session_id = cookies.signed[:as_sid] || SecureRandom.uuid
    cookies.signed[:as_sid] = {
      value: session_id,
      expires: 1.year.from_now,
      httponly: true,
      same_site: :lax
    }

    metadata['session_id'] ||= session_id

    result = Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: event_type,
      metadata: metadata.merge(request_metadata),
      user: current_user
    )

    if result.ok
      render json: { status: 'success' }
    else
      render json: { status: 'error', message: result.error }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("[EventsTrack] error: #{e.class}: #{e.message}")
    render json: { status: 'error', message: 'Internal Server Error' }, status: :internal_server_error
  end

  # POST /api/v1/analytics/track
  # Body: { company_id, event_type, metadata }
  def track
    # Ignore empty/truncated payloads from browsers/extensions to avoid noisy 400 logs.
    if request.raw_post.to_s.strip.blank? &&
       params[:event_type].blank? &&
       params[:event].blank? &&
       params.dig(:analytic, :event_type).blank?
      return head :no_content
    end

    raw_type = params[:event_type].presence || params[:event].presence || params.dig(:analytic, :event_type).presence
    company_id = params[:company_id].presence || params.dig(:company,
                                                            :id).presence || params.dig(:analytic, :company_id).presence
    event_id = params[:event_id].presence || params.dig(:analytic, :event_id).presence
    metadata =
      normalize_hash_param(params[:metadata]) ||
      normalize_hash_param(params[:data]) ||
      normalize_hash_param(params.dig(:analytic, :metadata)) ||
      {}

    return render json: { status: 'error', message: 'event_type ausente' }, status: :bad_request if raw_type.blank?

    event_type = map_event_type(raw_type)
    if company_id.blank? && !ALLOW_ANONYMOUS_EVENTS.include?(event_type)
      return render json: { status: 'error', message: 'company_id ausente' }, status: :bad_request
    end

    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: event_type,
      metadata: metadata.merge(request_metadata),
      user: current_user,
      event_id: event_id
    )

    render json: { status: 'success' }
  rescue ActiveRecord::RecordNotFound
    render json: { status: 'error', message: 'Company not found' }, status: :not_found
  rescue Pundit::NotAuthorizedError
    render json: { status: 'error', message: 'Forbidden' }, status: :forbidden
  rescue StandardError => e
    Rails.logger.error("[Analytics] track error: #{e.class}: #{e.message}")
    render json: { status: 'error', message: 'Erro interno no servidor' }, status: :internal_server_error
  end

  # GET /api/v1/analytics/conversions
  # Params: company_id (optional), days (defaults 30)
  def conversions
    company_id = params[:company_id]
    days = [(params[:days] || 30).to_i, 365].min
    from_time = days.days.ago

    scope = AnalyticsEvent.where('tracked_at >= ?', from_time)
    scope = scope.where(company_id: company_id) if company_id.present?

    grouped = scope.group(:event_type).count
    daily = scope.group('DATE(tracked_at)').count

    render json: {
      metrics: grouped,
      daily: daily,
      since: from_time
    }
  rescue StandardError => e
    Rails.logger.error("[Analytics] conversions error: #{e.class}: #{e.message}")
    render json: { status: 'error', message: 'Erro ao coletar conversoes' }, status: :internal_server_error
  end

  private

  def map_event_type(raw)
    case raw.to_s
    when 'view'
      'profile_view'
    when 'click'
      'cta_click'
    when 'whatsapp_click'
      'whatsapp_click'
    when 'lead'
      'lead_created'
    when 'review'
      'review_created'
    when 'badge_cta_click', 'badge_click', 'badges_cta_click'
      'badge_cta_click'
    when 'badge_cta_view', 'badges_cta_view'
      'badge_cta_view'
    when 'badges_tab_open'
      'badges_tab_open'
    else
      raw.to_s
    end
  end

  def normalize_hash_param(value)
    case value
    when ActionController::Parameters
      value.to_unsafe_h
    when Hash
      value
    end
  end
end
