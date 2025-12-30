# frozen_string_literal: true

class Api::V1::AnalyticsController < Api::V1::BaseController
  before_action :authenticate_api_user

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
    else
      raw.to_s
    end
  end

  def request_metadata
    {
      referrer: request.referer.to_s,
      user_agent: request.user_agent.to_s,
      path: request.fullpath.to_s
    }.compact
  end
end