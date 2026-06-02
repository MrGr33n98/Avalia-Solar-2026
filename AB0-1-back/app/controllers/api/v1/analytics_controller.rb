# frozen_string_literal: true

class Api::V1::AnalyticsController < Api::V1::BaseController
  before_action :authenticate_api_user, except: %i[track conversions events_track]
  before_action :check_rate_limit, only: %i[track events_track]
  ALLOW_ANONYMOUS_EVENTS = %w[page_view search web_vital micro_interaction].freeze
  LEGACY_EVENT_ALIASES = {
    'view' => 'profile_view',
    'Company Profile Viewed' => 'profile_view',
    'click' => 'cta_click',
    'CTA Clicked' => 'cta_click',
    'WhatsApp CTA Clicked' => 'whatsapp_click',
    'lead' => 'lead_created',
    'Lead Form Submitted' => 'lead_created',
    'Quote Request CTA Clicked' => 'lead_created',
    'badge_click' => 'badge_cta_click',
    'badges_cta_click' => 'badge_cta_click',
    'badges_cta_view' => 'badge_cta_view'
  }.freeze
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

    event_type = Array(params[:event_name] || params[:event_type]).first
    company_id = Array(params[:company_id]).first
    metadata = normalize_hash_param(params[:properties]) || normalize_hash_param(params[:metadata]) || {}
    
    return render json: { error: 'event_type is required' }, status: :bad_request if event_type.blank?
    event_type = map_event_type(event_type)

    # Validate micro-interaction events
    if event_type == 'micro_interaction'
      validator = MicroInteractionValidator.new(params)
      unless validator.valid?
        return render json: { errors: validator.errors }, status: :unprocessable_entity
      end
    end

    # Handle session_id and anonymous_id persistence
    session_id = cookies.signed[:as_sid] || SecureRandom.uuid
    cookies.signed[:as_sid] = {
      value: session_id,
      expires: 1.year.from_now,
      httponly: true,
      same_site: :lax
    }

    anonymous_id = cookies[:anonymous_id] || generate_anonymous_id
    metadata['session_id'] ||= session_id
    metadata['anonymous_id'] ||= anonymous_id

    result = Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: event_type,
      metadata: metadata.merge(request_metadata),
      user: current_user
    )

    if result.ok
      render json: { status: 'success', event_id: result.event&.id }
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

    raw_type = Array(params[:event_type].presence || params[:event].presence || params.dig(:analytic, :event_type).presence).first
    legacy_properties =
      normalize_hash_param(params[:properties]) ||
      normalize_hash_param(params.dig(:analytic, :properties)) ||
      {}
    company_id =
      Array(
        params[:company_id].presence ||
        params.dig(:company, :id).presence ||
        params.dig(:analytic, :company_id).presence ||
        legacy_properties['company_id'].presence ||
        legacy_properties[:company_id].presence
      ).first
    event_id = Array(params[:event_id].presence || params.dig(:analytic, :event_id).presence).first
    metadata =
      normalize_hash_param(params[:metadata]) ||
      normalize_hash_param(params[:data]) ||
      normalize_hash_param(params.dig(:analytic, :metadata)) ||
      legacy_properties.presence ||
      {}
    tracked_at =
      parse_tracked_at(
        params[:tracked_at].presence ||
        params.dig(:analytic, :tracked_at).presence ||
        metadata['tracked_at'].presence ||
        metadata[:tracked_at].presence
      )

    unless raw_type.present?
      Rails.logger.warn('[Analytics] Rejecting event: event_type missing')
      return render json: { status: 'error', message: 'event_type ausente' }, status: :bad_request 
    end

    event_type = map_event_type(raw_type)
    log_legacy_alias_usage(raw_type: raw_type, canonical_event_type: event_type, company_id: company_id) if raw_type.to_s != event_type.to_s
    
    if company_id.blank? && !ALLOW_ANONYMOUS_EVENTS.include?(event_type)
      Rails.logger.warn("[Analytics] Rejecting event: company_id missing for non-anonymous event '#{event_type}'")
      return render json: { status: 'error', message: 'company_id ausente' }, status: :bad_request
    end

    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: event_type,
      metadata: metadata.merge(request_metadata),
      user: current_user,
      tracked_at: tracked_at,
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

  # GET /api/v1/analytics/overview
  # Params: dimension=brand, value=weg, days=30
  def overview
    dimension = params[:dimension].to_s
    value = params[:value].to_s
    days = [(params[:days] || 30).to_i, 365].min

    query = Analytics::DimensionQuery.new(dimension: dimension, value: value)
    cache_key = "analytics:overview:#{query.cache_key}:#{days}"

    payload = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      from_time = days.days.ago
      scope = query.scope.where('tracked_at >= ?', from_time)

      views = scope.where(event_type: 'product_view').count
      clicks = scope.where(event_type: 'product_click').count
      cta_clicks = scope.where(event_type: 'product_cta_click').count
      conversion = views.positive? ? ((cta_clicks.to_f / views) * 100).round(2) : 0

      {
        dimension: dimension,
        value: query.label,
        days: days,
        views: views,
        clicks: clicks,
        cta_clicks: cta_clicks,
        conversion_rate: conversion,
        data_source: 'analytics_events'
      }
    end

    render json: payload
  rescue ArgumentError => e
    render json: { status: 'error', message: e.message }, status: :bad_request
  rescue ActiveRecord::RecordNotFound
    render json: { status: 'error', message: 'Dimension value not found' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("[Analytics] overview error: #{e.class}: #{e.message}")
    render json: { status: 'error', message: 'Erro ao coletar overview' }, status: :internal_server_error
  end

  # GET /api/v1/analytics/funnel
  # Params: dimension=brand, value=weg, steps=product_view,product_click,product_cta_click, days=30
  def funnel
    dimension = params[:dimension].to_s
    value = params[:value].to_s
    days = [(params[:days] || 30).to_i, 365].min
    steps = params[:steps].to_s.split(',').map(&:strip).reject(&:blank?)
    steps = %w[product_view product_click product_cta_click] if steps.empty?

    query = Analytics::DimensionQuery.new(dimension: dimension, value: value)
    cache_key = "analytics:funnel:#{query.cache_key}:#{steps.join('-')}:#{days}"

    payload = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      from_time = days.days.ago
      scope = query.scope.where('tracked_at >= ?', from_time)
      funnel = build_funnel(scope, steps)

      {
        dimension: dimension,
        value: query.label,
        days: days,
        steps: funnel,
        data_source: 'analytics_events'
      }
    end

    render json: payload
  rescue ArgumentError => e
    render json: { status: 'error', message: e.message }, status: :bad_request
  rescue ActiveRecord::RecordNotFound
    render json: { status: 'error', message: 'Dimension value not found' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("[Analytics] funnel error: #{e.class}: #{e.message}")
    render json: { status: 'error', message: 'Erro ao coletar funnel' }, status: :internal_server_error
  end

  private

  def map_event_type(raw)
    raw_string = raw.to_s
    return LEGACY_EVENT_ALIASES[raw_string] if LEGACY_EVENT_ALIASES.key?(raw_string)

    case raw_string
    when 'whatsapp_click'
      'whatsapp_click'
    when 'Email CTA Clicked'
      'Email CTA Clicked'
    when 'Phone CTA Clicked'
      'Phone CTA Clicked'
    when 'Website CTA Clicked'
      'Website CTA Clicked'
    when 'review'
      'review_created'
    when 'badge_cta_click'
      'badge_cta_click'
    when 'badge_cta_view'
      'badge_cta_view'
    when 'badges_tab_open'
      'badges_tab_open'
    else
      raw_string
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

  def parse_tracked_at(value)
    return nil if value.blank?

    value.is_a?(Time) ? value : Time.zone.parse(value.to_s)
  rescue ArgumentError, TypeError
    nil
  end

  def log_legacy_alias_usage(raw_type:, canonical_event_type:, company_id:)
    Rails.logger.info(
      {
        event: 'analytics_legacy_alias',
        raw_event_type: raw_type.to_s,
        canonical_event_type: canonical_event_type,
        company_id: company_id,
        user_id: current_user&.id,
        timestamp: Time.current.iso8601
      }.to_json
    )
  end

  def build_funnel(scope, steps)
    previous_sessions = nil
    steps.map.with_index do |step, index|
      step_scope = scope.where(event_type: step)
      sessions = session_ids_for(step_scope)
      sessions &= previous_sessions if previous_sessions

      conversion_rate =
        if index.positive? && previous_sessions&.any?
          ((sessions.count.to_f / previous_sessions.count) * 100).round(2)
        else
          100.0
        end

      previous_sessions = sessions

      {
        event: step,
        session_count: sessions.count,
        conversion_rate_from_previous: conversion_rate,
        drop_off_rate: (100 - conversion_rate).round(2)
      }
    end
  end

  def session_ids_for(scope)
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    if adapter.include?('postgres')
      scope
        .where("metadata ? 'session_id'")
        .distinct
        .pluck(Arel.sql("metadata->>'session_id'"))
    else
      scope.map { |event| event.metadata['session_id'] }.compact.uniq
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

  def check_rate_limit
    # Redis-based rate limiting: 100 events per minute per IP
    key = "analytics:#{request.ip}"
    count = Rails.cache.read(key) || 0
    
    if count >= 100
      render json: { error: 'Rate limit exceeded' }, status: :too_many_requests
      return
    end
    
    Rails.cache.write(key, count + 1, expires_in: 1.minute)
  end

  def generate_anonymous_id
    id = SecureRandom.uuid
    cookies[:anonymous_id] = {
      value: id,
      expires: 2.years.from_now,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax
    }
    id
  end
end
