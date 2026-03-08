# frozen_string_literal: true

class Api::V1::AnalyticsController < Api::V1::BaseController
  before_action :authenticate_api_user, except: %i[track conversions events_track]
  ALLOW_ANONYMOUS_EVENTS = %w[page_view search web_vital].freeze
  CORE_CONVERSION_EVENT_MAP = {
    'profile_view' => :profile_views,
    'Company Profile Viewed' => :profile_views,
    'cta_click' => :cta_clicks,
    'CTA Clicked' => :cta_clicks,
    'whatsapp_click' => :whatsapp_clicks,
    'WhatsApp CTA Clicked' => :whatsapp_clicks,
    'Email CTA Clicked' => :email_clicks,
    'Phone CTA Clicked' => :phone_clicks,
    'Website CTA Clicked' => :website_clicks,
    'lead_created' => :leads,
    'Lead Form Submitted' => :leads,
    'Quote Request CTA Clicked' => :leads
  }.freeze

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
    from_day = from_time.to_date
    to_day = Date.current

    scope = AnalyticsEvent.where('tracked_at >= ?', from_time)
    scope = scope.where(company_id: company_id) if company_id.present?

    if company_id.present?
      metrics, daily, data_source = canonical_company_conversions(
        company_id: company_id,
        scope: scope,
        days: days,
        from_day: from_day,
        to_day: to_day
      )
    else
      metrics = scope.group(:event_type).count
      daily = scope.group('DATE(tracked_at)').count
      data_source = 'analytics_events'
    end

    render json: {
      metrics: metrics,
      daily: daily,
      since: from_time,
      data_source: data_source
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
    when 'Company Profile Viewed'
      'profile_view'
    when 'click'
      'cta_click'
    when 'CTA Clicked'
      'cta_click'
    when 'whatsapp_click', 'WhatsApp CTA Clicked'
      'whatsapp_click'
    when 'Email CTA Clicked'
      'Email CTA Clicked'
    when 'Phone CTA Clicked'
      'Phone CTA Clicked'
    when 'Website CTA Clicked'
      'Website CTA Clicked'
    when 'lead', 'Lead Form Submitted', 'Quote Request CTA Clicked'
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

  def canonical_company_conversions(company_id:, scope:, days:, from_day:, to_day:)
    source = CompanyDashboard::MetricsSource.new(company_id: company_id)
    unless source.available?
      return [scope.group(:event_type).count, scope.group('DATE(tracked_at)').count, 'analytics_events_fallback']
    end

    core_totals = source.totals(from_day:, to_day:) || {}

    non_core_scope = scope.where.not(event_type: CORE_CONVERSION_EVENT_MAP.keys)
    metrics = non_core_scope.group(:event_type).count
    CORE_CONVERSION_EVENT_MAP.each do |event_type, key|
      metrics[event_type] = core_totals[key].to_i
    end

    core_daily = source.timeseries(days:).to_h do |row|
      [
        row[:date].to_date,
        row[:profile_views].to_i + row[:cta_clicks].to_i + row[:whatsapp_clicks].to_i + row[:leads].to_i
      ]
    end
    non_core_daily = non_core_scope.group('DATE(tracked_at)').count.transform_keys { |key| key.to_date }
    merged_daily = Hash.new(0)
    core_daily.each { |day, total| merged_daily[day] += total.to_i }
    non_core_daily.each { |day, total| merged_daily[day] += total.to_i }

    [metrics, merged_daily.sort.to_h, 'company_daily_stats+analytics_events']
  end
end
