# frozen_string_literal: true

class Api::V1::AnalyticsController < Api::V1::BaseController
  before_action :authenticate_api_user, except: %i[track conversions]

  # POST /api/v1/analytics/track
  # Body: { company_id, event_type, metadata }
  def track
    raw_type = params[:event_type].presence || params[:event].presence
    company_id = params[:company_id].presence || params.dig(:company, :id)
    metadata = params[:metadata].is_a?(Hash) ? params[:metadata] : (params[:data].is_a?(Hash) ? params[:data] : {})

    return render json: { status: 'error', message: 'company_id ausente' }, status: :bad_request if company_id.blank?
    return render json: { status: 'error', message: 'event_type ausente' }, status: :bad_request if raw_type.blank?

    event_type = map_event_type(raw_type)

    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: event_type,
      metadata: metadata.merge(request_metadata),
      user: current_user
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
    daily = scope.group("DATE(tracked_at)").count

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
end
