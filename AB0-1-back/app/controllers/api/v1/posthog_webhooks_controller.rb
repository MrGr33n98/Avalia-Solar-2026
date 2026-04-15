# frozen_string_literal: true

# app/controllers/api/v1/posthog_webhooks_controller.rb
#
# Receives PostHog webhook events and stores them in analytics_events table.
# Also triggers n8n workflows for high-intent behavioral events.
#
# PostHog config: Settings → Webhooks → Add webhook
# URL: https://n8n.avaliasolar.com.br/webhook/posthog-event
# Events: wizard_complete, roi_expand, whatsapp_click, lead_created, ev_calc_complete
#
# Alternative: This Rails endpoint can also receive directly:
# POST /api/v1/posthog_webhook

module Api
  module V1
    class PosthogWebhooksController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_webhook

      # POST /api/v1/posthog_webhook
      def create
        event = PosthogEventIngestor.call(params.permit!)

        render json: { success: true, event_id: event[:id] }, status: :created
      rescue PosthogEventIngestor::InvalidEvent => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error "[PostHogWebhook] Error: #{e.message}"
        render json: { error: 'Internal error' }, status: :internal_server_error
      end

      # GET /api/v1/posthog_webhook/health
      def health
        count = AnalyticsEvent.count
        render json: { status: 'ok', events_count: count }
      end

      private

      def authenticate_webhook
        token = request.headers['Authorization']&.gsub('Bearer ', '')
        expected = ENV.fetch('POSTHOG_WEBHOOK_SECRET', nil)

        if expected.blank?
          Rails.logger.warn '[PostHogWebhook] POSTHOG_WEBHOOK_SECRET not set — accepting all requests'
          return
        end

        unless ActiveSupport::SecurityUtils.secure_compare(token, expected)
          render json: { error: 'Unauthorized' }, status: :unauthorized
        end
      end
    end
  end
end

# ── Event Ingestor ───────────────────────────────────────────────────────
# Handles parsing, validation, enrichment, and storage of PostHog events.

class PosthogEventIngestor
  class InvalidEvent < StandardError; end

  ALLOWED_EVENTS = %w[
    wizard_start roi_expand wizard_complete wizard_abandon
    ev_calc_start wallbox_config savings_show ev_calc_complete
    whatsapp_click compare_view review_viewed trust_badge_clicked
    installer_profile_visited lead_created content_view cta_click
    pageview pageleave
  ].freeze

  def self.call(params)
    new(params).call
  end

  def initialize(params)
    @params = params.to_h.deep_symbolize_keys
  end

  def call
    validate!
    enrich!
    store!
    trigger_downstream!

    { id: @event.id, event_name: @event.event_name }
  end

  private

  attr_reader :params, :event

  def validate!
    event_name = params[:event] || params[:properties]&.dig('$event_name')

    raise InvalidEvent, 'Missing event name' if event_name.blank?
    raise InvalidEvent, "Unknown event: #{event_name}" unless ALLOWED_EVENTS.include?(event_name.to_s)

    distinct_id = params[:distinct_id]
    raise InvalidEvent, 'Missing distinct_id' if distinct_id.blank?

    @event_name = event_name.to_s
    @distinct_id = distinct_id.to_s
  end

  def enrich!
    props = (params[:properties] || {}).with_indifferent_access

    @enriched = {
      event_name: @event_name,
      user_session_id: @distinct_id,
      user_id: extract_user_id(props),
      page_url: props['$current_url'] || props['page_url'],
      city: normalize_city(props['city'] || props['$city']),
      state: normalize_state(props['state'] || props['$region']),
      company_id: props['company_id'],
      category_id: props['category_id'],
      vertical: normalize_vertical(props['vertical']),
      audience: normalize_audience(props['audience']),
      utm_source: props['utm_source'],
      utm_medium: props['utm_medium'],
      utm_campaign: props['utm_campaign'],
      utm_content: props['utm_content'],
      referrer: props['$referrer'] || props['referrer'],
      metadata: build_metadata(props)
    }
  end

  def store!
    @event = AnalyticsEvent.create!(@enriched)
  end

  def trigger_downstream!
    return unless conversion_event?

    # Forward to n8n for real-time processing
    GrowthEventForwarder.call(@event)
  end

  def conversion_event?
    %w[wizard_complete whatsapp_click lead_created ev_calc_complete].include?(@event_name)
  end

  def extract_user_id(props)
    props['lead_id'] || props['user_id'] || params[:distinct_id]
  end

  def normalize_city(city)
    return nil if city.blank?

    # Standardize common city names
    city_map = {
      'florianopolis' => 'Florianópolis',
      'floripa' => 'Florianópolis',
      'sao jose' => 'São José',
      'sao paulo' => 'São Paulo',
      'bh' => 'Belo Horizonte',
      'belo horizonte' => 'Belo Horizonte',
      'rio' => 'Rio de Janeiro',
      'rio de janeiro' => 'Rio de Janeiro',
      'balneario camboriu' => 'Balneário Camboriú',
      'balneario' => 'Balneário Camboriú',
    }

    normalized = city.downcase.strip
    city_map[normalized] || city.titleize
  end

  def normalize_state(region)
    return nil if region.blank?

    state_map = {
      'santa catarina' => 'SC',
      'sao paulo' => 'SP',
      'parana' => 'PR',
      'rio grande do sul' => 'RS',
      'minas gerais' => 'MG',
      'rio de janeiro' => 'RJ',
    }

    normalized = region.to_s.downcase.strip
    state_map[normalized] || normalized.upcase.first(2)
  end

  def normalize_vertical(vertical)
    return 'solar' if vertical.blank?

    v = vertical.to_s.downcase
    return 'ev' if v.include?('eletr') || v.include?('ev') || v.include?('mobilidade')
    return 'hybrid' if v.include?('hybrid') || v.include?('hibrid') || (v.include?('solar') && v.include?('ev'))

    'solar'
  end

  def normalize_audience(audience)
    return 'b2c' if audience.blank?

    a = audience.to_s.downcase
    return 'b2b' if %w[b2b empresa comercial industrial corporativo].include?(a)

    'b2c'
  end

  def build_metadata(props)
    # Extract all properties that aren't top-level columns
    excluded = %w[
      $current_url $city $region $country_name $referrer $lib $lib_version
      $os $browser $device_type $screen_height $screen_width
      city state vertical audience utm_source utm_medium utm_campaign utm_content
      lead_id user_id company_id category_id page_url referrer
      $event_name distinct_id
    ]

    props.to_h.reject { |k, _| excluded.include?(k.to_s) }
  end
end

# ── Forwarder to n8n ─────────────────────────────────────────────────────
# Sends conversion events to n8n for real-time processing.

class GrowthEventForwarder
  def self.call(event)
    new(event).call
  end

  def initialize(event)
    @event = event
  end

  def call
    return if n8n_url.blank?

    payload = {
      event_name: @event.event_name,
      session_id: @event.user_session_id,
      user_id: @event.user_id,
      city: @event.city,
      state: @event.state,
      vertical: @event.vertical,
      audience: @event.audience,
      company_id: @event.company_id,
      category_id: @event.category_id,
      utm_source: @event.utm_source,
      utm_medium: @event.utm_medium,
      utm_campaign: @event.utm_campaign,
      utm_content: @event.utm_content,
      timestamp: @event.created_at&.iso8601,
      source: 'posthog_webhook'
    }

    # Fire and forget — don't block the response
    send_to_n8n(payload)
  end

  private

  attr_reader :event

  def n8n_url
    ENV.fetch('N8N_WEBHOOK_URL', nil)
  end

  def webhook_secret
    ENV.fetch('N8N_WEBHOOK_SECRET', nil)
  end

  def send_to_n8n(payload)
    uri = URI(n8n_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    http.open_timeout = 5
    http.read_timeout = 10

    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request['Authorization'] = "Bearer #{webhook_secret}" if webhook_secret.present?
    request.body = payload.to_json

    http.request(request)
  rescue StandardError => e
    Rails.logger.error "[GrowthEventForwarder] Failed to forward to n8n: #{e.message}"
  end
end
