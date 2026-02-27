# frozen_string_literal: true

require 'uri'
require 'json'

module Analytics
  class TrackEventService
    Result = Struct.new(:ok, :event, :error, keyword_init: true)

    GLOBAL_EVENTS = %w[page_view search landing_view web_vital].freeze
    INTERNAL_SYSTEM_EVENTS = %w[page_view search landing_view theme_changed theme_changed_dashboard web_vital performance_metric error_occurred].freeze
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
    PUBLIC_COMPANY_EVENTS = %w[profile_view cta_click whatsapp_click ranking_click winner_badge_download].freeze

    def self.call(company_id:, event_type:, metadata: {}, user: nil, tracked_at: nil, event_id: nil)
      new(company_id: company_id, event_type: event_type, metadata: metadata, user: user, occurred_at: tracked_at, event_id: event_id).call
    end

    def initialize(company_id:, event_type:, metadata: {}, user: nil, occurred_at: nil, event_id: nil, user_id: nil)
      @company_id = company_id
      @user = user || (user_id ? User.find_by(id: user_id) : nil)
      @event_type = event_type.to_s
      @metadata = sanitize_metadata(metadata)
      @occurred_at = occurred_at.presence || Time.current
      @event_id = event_id || generate_event_id
    end

    def call
      return Result.new(ok: false, error: 'event_type missing') if @event_type.blank?

      company = Company.find(@company_id) if @company_id.present?

      if skip_persistence_for_global_event?
        increment_global_event_metric!
        Rails.logger.info("[Analytics] Skipping DB persistence for global event without company_id: #{normalized_event_type}")
        return Result.new(ok: true, event: nil, error: 'global_event_without_company_skipped')
      end

      return Result.new(ok: false, error: 'company_id missing for event') if @company_id.blank?

      authorize!(company) if company

      return Result.new(ok: false, error: 'invalid_contract') unless validate_contract!
      
      return Result.new(ok: true) unless postgresql?

      return Result.new(ok: true, event: nil, error: 'duplicate_event') unless ensure_unique_event!

      persist_platform_event!
      persist_legacy_analytics_event! if dual_write_active? && should_dual_write?

      increment_company_counters(company) if company
      increment_yabeda_metrics_for_event
      broadcast_realtime
      track_mixpanel_async

      Result.new(ok: true)
    rescue StandardError => e
      Rails.logger.error("[G4-Analytics] TrackEventService error: #{e.class} #{e.message}")        
      Result.new(ok: false, error: e.message)
    end

    private

    def parse_jsonb_array(field)
      return [] if field.nil? || field.blank?
      return field if field.is_a?(Array)

      JSON.parse(field)
    end

    def validate_contract!
      registry = Analytics::EventRegistry.fetch(@event_type)

      if registry.nil?
        record_ingest_error("unknown_event")
        return false if ENV['STRICT_REGISTRY_VALIDATION'] == 'true'
      elsif [false, 'f', 0, '0'].include?(registry['enabled'])
        record_ingest_error("disabled_event")
        return false
      else
        required_keys = parse_jsonb_array(registry['required_keys'])
        missing_keys = required_keys - @metadata.keys
        if missing_keys.any?
          record_ingest_error("missing_required_keys: #{missing_keys.join(',')}")
          return false if ENV['STRICT_REGISTRY_VALIDATION'] == 'true'
        end
      end
      true
    end

    def record_ingest_error(reason)
      return unless postgresql?
      sql = "INSERT INTO event_ingest_errors (event_id, event_type, payload, error_reason) VALUES ($1, $2, $3::jsonb, $4)"
      ActiveRecord::Base.connection.exec_query(sql, 'IngestError', [
        [nil, @event_id], [nil, @event_type], [nil, @metadata.to_json], [nil, reason]
      ])
    end

    def ensure_unique_event!
      sql = "INSERT INTO analytics_event_dedup (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING 1"
      res = ActiveRecord::Base.connection.exec_query(sql, 'Dedupe', [[nil, @event_id]])
      res.any?
    end

    def persist_platform_event!
      payload = @metadata.except('source', 'anonymous_id', 'session_id', 'subject_type', 'subject_id')
      context = { ip: @metadata['ip'], user_agent: @metadata['user_agent'], referrer: @metadata['referrer'] }.compact

      sql = <<~SQL
        INSERT INTO platform_events (
          event_id, event_type, schema_version, source, anonymous_id, session_id,
          user_id, company_id, subject_type, subject_id, payload, context, occurred_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13)
      SQL
      ActiveRecord::Base.connection.exec_query(sql, 'PlatformEventInsert', [
        [nil, @event_id], [nil, @event_type], [nil, 1],
        [nil, @metadata['source']], [nil, @metadata['anonymous_id']], [nil, @metadata['session_id']],
        [nil, @user&.id], [nil, @company_id], [nil, @metadata['subject_type']], [nil, @metadata['subject_id']],
        [nil, payload.to_json], [nil, context.to_json], [nil, @occurred_at]
      ])
    end

    def dual_write_active?
      ENV['G4_ANALYTICS_DUAL_WRITE'] == 'true'
    end

    def should_dual_write?
      @company_id.present? || INTERNAL_SYSTEM_EVENTS.include?(@event_type)
    end

    def persist_legacy_analytics_event!
      AnalyticsEvent.create!(
        event_id: @event_id, company_id: @company_id, user_id: @user&.id,
        event_type: @event_type, metadata: @metadata, tracked_at: @occurred_at
      )
    rescue ActiveRecord::ActiveRecordError => e
      Rails.logger.error(
        "[G4-Analytics] Legacy Persistence Failed | " \
        "event_id=#{@event_id} | #{e.class}: #{e.message}"
      )
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end

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
      normalized_type = normalized_event_type
      return if INTERNAL_SYSTEM_EVENTS.include?(normalized_type)
      return if @user.nil?
      return if @user.respond_to?(:admin?) && @user.admin?
      return if @user.respond_to?(:review_user?) && @user.review_user?

      if @user.respond_to?(:company_user?) && @user.company_user?
        same_company = @user.company_id == company.id || (@user.respond_to?(:active_membership_for?) && @user.active_membership_for?(company.id))
        return if same_company || PUBLIC_COMPANY_EVENTS.include?(normalized_type)
        raise Pundit::NotAuthorizedError, 'Forbidden'
      end

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

    def skip_persistence_for_global_event?
      @company_id.blank? && GLOBAL_EVENTS.include?(normalized_event_type)
    end

    def increment_company_counters(company)
      counter = EVENT_TO_COMPANY_COUNTER[normalized_event_type]
      return unless counter
      Company.increment_counter(counter, company.id)
    end

    def increment_global_event_metric!
      return unless defined?(Yabeda)
      Yabeda.ab0.analytics_events_total.increment({ event_type: normalized_event_type }, by: 1)  
    rescue StandardError => e
      Rails.logger.warn("[Analytics] global metric increment failed: #{e.message}")
    end

    def increment_yabeda_metrics_for_event
      return unless defined?(Yabeda)
      Yabeda.ab0.analytics_events_total.increment({ event_type: normalized_event_type }, by: 1)
      return unless normalized_event_type == 'profile_view'
      Yabeda.ab0.company_views_total.increment({ company_id: @company_id }, by: 1)
    end

    def broadcast_realtime
      return unless @company_id.present?
      ActionCable.server.broadcast("company:#{@company_id}:dashboard", { type: 'analytics_event', event_type: @event_type, tracked_at: @occurred_at, company_id: @company_id, metadata: @metadata })
    rescue StandardError => e
      Rails.logger.warn("[Analytics] broadcast failed: #{e.message}")
    end

    def generate_event_id
      "evt_#{Time.current.to_i}_#{SecureRandom.hex(6)}"
    end

    def should_track_mixpanel?
      Rails.env.production? || ENV['MIXPANEL_ENABLED'] == 'true'
    end

    def track_mixpanel_async
      return unless should_track_mixpanel? && ENV['MIXPANEL_PROJECT_TOKEN'].present?
      return unless defined?(Analytics::MixpanelJob)
      Analytics::MixpanelJob.perform_later(
        distinct_id: @user&.id || "comp_#{@company_id}" || "anon_#{SecureRandom.hex(8)}",
        event_name: @event_type,
        properties: { company_id: @company_id, user_id: @user&.id, environment: Rails.env.to_s, platform: 'backend', server_timestamp: @occurred_at.to_i, **@metadata }
      )
    rescue StandardError => e
      Rails.logger.warn("[Analytics] Mixpanel job enqueue failed: #{e.message}")
    end
  end
end
