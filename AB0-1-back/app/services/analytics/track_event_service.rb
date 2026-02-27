# frozen_string_literal: true

require 'uri'

module Analytics
  class TrackEventService
    Result = Struct.new(:ok, :event, :error, keyword_init: true)

    EVENT_TO_DAILY_COLUMN = {
      'profile_view' => :profile_views,
      'cta_click' => :cta_clicks,
      'whatsapp_click' => :whatsapp_clicks,
      'lead_created' => :leads,
      'review_created' => :reviews
    }.freeze

    EVENT_TO_COMPANY_COUNTER = {
      'profile_view' => :profile_views_count,
      'cta_click' => :cta_clicks_count,
      'whatsapp_click' => :whatsapp_clicks_count
    }.freeze

    GLOBAL_EVENTS = %w[page_view search landing_view].freeze
    INTERNAL_SYSTEM_EVENTS = %w[
      page_view
      search
      landing_view
      theme_changed
      theme_changed_dashboard
      web_vital
      performance_metric
      error_occurred
    ].freeze
    PUBLIC_COMPANY_EVENTS = %w[profile_view cta_click whatsapp_click ranking_click winner_badge_download].freeze

    def self.call(company_id:, event_type:, metadata: {}, user: nil, tracked_at: nil, event_id: nil)
      new(company_id: company_id, event_type: event_type, metadata: metadata, user: user, occurred_at: tracked_at,
          event_id: event_id).call
    end

    def initialize(company_id:, event_type:, metadata: {}, user: nil, occurred_at: nil, event_id: nil, user_id: nil)
      @company_id = company_id
      @user = user || (User.find_by(id: user_id) if user_id)
      @event_type = event_type.to_s
      @metadata = sanitize_metadata(metadata)
      @occurred_at = occurred_at.presence || Time.current
      @event_id = event_id || generate_event_id
    end

    def call
      return Result.new(ok: false, error: 'event_type missing') if @event_type.blank?

      company = Company.find(@company_id) if @company_id.present?

      if @company_id.blank? && !GLOBAL_EVENTS.include?(normalized_event_type)
        return Result.new(ok: false, error: 'company_id missing for event')
      end

      authorize!(company) if company

      # Check for duplicate event_id (dedupe)
      if AnalyticsEvent.exists?(event_id: @event_id)
        Rails.logger.debug("[Analytics] Dedupe: #{@event_type} (#{@event_id})")
        return Result.new(ok: true, event: nil, error: 'duplicate_event')
      end

      ActiveRecord::Base.transaction do
        event = AnalyticsEvent.create!(
          event_id: @event_id,
          company_id: @company_id,
          user_id: @user&.id,
          event_type: @event_type,
          metadata: @metadata,
          tracked_at: @occurred_at
        )

        increment_daily_stat!(event)
        increment_company_counters(company) if company
        increment_yabeda_metrics(event)
        broadcast!(event)

        # Send to Mixpanel (async)
        track_mixpanel(event) if should_track_mixpanel?

        return Result.new(ok: true, event: event)
      end
    rescue StandardError => e
      Rails.logger.error("[Analytics] TrackEventService error: #{e.class} #{e.message}")
      Result.new(ok: false, error: e.message)
    end

    private

    WHITELIST_KEYS = %w[
      utm_source utm_medium utm_campaign utm_term utm_content
      gclid fbclid msclkid landing_path referrer_host attribution
      referrer path page_path item_id ip user_agent viewport source placement
      variant button_variant rating lead_id product_id status city state
      activation_time previous_status method distributed_to_count company_ids
      query results_count category_id banner_id company_id
    ].freeze

    ALLOWED_UTM_KEYS = %w[
      utm_source utm_medium utm_campaign utm_term utm_content gclid fbclid msclkid
    ].freeze

    def sanitize_metadata(meta)
      return {} unless meta.is_a?(Hash)

      meta = meta.stringify_keys
      meta.merge!(meta['utm'].stringify_keys) if meta['utm'].is_a?(Hash)
      meta.merge!(meta['metadata'].stringify_keys) if meta['metadata'].is_a?(Hash)

      sanitized = meta.slice(*WHITELIST_KEYS).compact
      sanitized.merge!(sanitize_utm_hash(sanitized))

      sanitized['attribution'] = sanitize_attribution(sanitized['attribution']) if sanitized['attribution'].present?

      sanitized['landing_path'] = strip_path(sanitized['landing_path'])
      sanitized['referrer_host'] = strip_host(sanitized['referrer_host'])

      sanitized.compact
    end

    def sanitize_attribution(raw)
      return nil unless raw.is_a?(Hash)

      touches = {}
      %w[first_touch last_touch].each do |touch_key|
        touch = raw[touch_key] || raw[touch_key.to_sym]
        next unless touch.is_a?(Hash)

        values = sanitize_utm_hash(touch['values'] || touch[:values] || touch)
        touch_payload = {
          values: values,
          landing_path: strip_path(touch['landing_path'] || touch[:landing_path]),
          referrer_host: strip_host(touch['referrer_host'] || touch[:referrer_host]),
          ts: touch['ts'] || touch[:ts]
        }.compact

        touches[touch_key] = touch_payload if touch_payload.present?
      end

      ttl = raw['ttl_days'] || raw[:ttl_days]
      touches['ttl_days'] = ttl if ttl

      touches.presence
    end

    def sanitize_utm_hash(hash)
      return {} unless hash.is_a?(Hash)

      utm_values = {}
      hash.stringify_keys.slice(*ALLOWED_UTM_KEYS).each do |key, value|
        norm = normalize_value(value)
        utm_values[key] = norm if norm.present?
      end
      utm_values
    end

    def strip_path(value)
      return nil if value.blank?

      uri = begin
        URI.parse(value)
      rescue StandardError
        nil
      end
      return value if uri.nil?

      uri.path.presence || '/'
    end

    def strip_host(value)
      return nil if value.blank?

      uri = begin
        URI.parse(value)
      rescue StandardError
        nil
      end
      return value.to_s if uri.nil?

      uri.host
    end

    def normalize_value(value)
      value.to_s.downcase.strip.gsub(/[^a-z0-9_.-]/, '')[0, 255]
    end

    def authorize!(company)
      # Telemetry/internal events should not fail authorization checks.
      normalized_type = normalized_event_type
      return if INTERNAL_SYSTEM_EVENTS.include?(normalized_type)

      # Internal/system events created by jobs or callbacks.
      return if @user.nil?
      return if @user.respond_to?(:admin?) && @user.admin?
      return if @user.respond_to?(:review_user?) && @user.review_user?

      if @user.respond_to?(:company_user?) && @user.company_user?
        same_company =
          @user.company_id == company.id ||
          (@user.respond_to?(:active_membership_for?) && @user.active_membership_for?(company.id))

        return if same_company || PUBLIC_COMPANY_EVENTS.include?(normalized_type)

        raise Pundit::NotAuthorizedError, 'Forbidden'
      end

      # Regular users can only track public-facing events.
      return if PUBLIC_COMPANY_EVENTS.include?(normalized_type) || GLOBAL_EVENTS.include?(normalized_type)

      raise Pundit::NotAuthorizedError, 'Forbidden'
    rescue StandardError => e
      raise if e.is_a?(Pundit::NotAuthorizedError)

      Rails.logger.warn("[Analytics] authorize! fallback allow due error=#{e.class}: #{e.message}")
      nil
    end

    def normalized_event_type
      @normalized_event_type ||= @event_type.to_s.downcase.gsub(/\s+/, '_')
    end

    def increment_daily_stat!(event)
      return if event.company_id.blank?

      col = EVENT_TO_DAILY_COLUMN[normalized_event_type]
      return unless col

      day = event.tracked_at.to_date

      CompanyDailyStat.transaction do
        stat = CompanyDailyStat.lock.find_or_create_by!(company_id: event.company_id, day: day)
        stat.update_column(col, stat.public_send(col).to_i + 1)
      end
    end

    def increment_company_counters(company)
      counter = EVENT_TO_COMPANY_COUNTER[normalized_event_type]
      return unless counter

      Company.increment_counter(counter, company.id)
    end

    def increment_yabeda_metrics(event)
      return unless defined?(Yabeda)

      Yabeda.ab0.analytics_events_total.increment({ event_type: normalized_event_type }, by: 1)

      return unless normalized_event_type == 'profile_view'

      Yabeda.ab0.company_views_total.increment({ company_id: event.company_id }, by: 1)
    end

    def broadcast!(event)
      return unless event.company_id.present?

      ActionCable.server.broadcast(
        "company:#{event.company_id}:dashboard",
        {
          type: 'analytics_event',
          event_type: event.event_type,
          tracked_at: event.tracked_at,
          company_id: event.company_id,
          metadata: event.metadata
        }
      )
    rescue StandardError => e
      Rails.logger.warn("[Analytics] broadcast failed: #{e.message}")
    end

    def generate_event_id
      "evt_#{Time.current.to_i}_#{SecureRandom.hex(6)}"
    end

    def should_track_mixpanel?
      Rails.env.production? || ENV['MIXPANEL_ENABLED'] == 'true'
    end

    def track_mixpanel(event)
      return unless ENV['MIXPANEL_PROJECT_TOKEN'].present?

      # Use the nested MixpanelJob if it exists, otherwise skip
      return unless defined?(Analytics::MixpanelJob)

      Analytics::MixpanelJob.perform_later(
        distinct_id: event.user_id || "comp_#{event.company_id}" || "anon_#{SecureRandom.hex(8)}",
        event_name: event.event_type,
        properties: {
          company_id: event.company_id,
          user_id: event.user_id,
          environment: Rails.env.to_s,
          platform: 'backend',
          server_timestamp: event.tracked_at.to_i,
          **event.metadata
        }
      )
    rescue StandardError => e
      Rails.logger.warn("[Analytics] Mixpanel job enqueue failed: #{e.message}")
    end
  end
end
