# frozen_string_literal: true

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

    def self.call(company_id:, event_type:, metadata: {}, user: nil, tracked_at: nil, event_id: nil)
      new(company_id: company_id, event_type: event_type, metadata: metadata, user: user, occurred_at: tracked_at, event_id: event_id).call
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

      company = Company.find(@company_id)
      authorize!(company)

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
        increment_company_counters(company)
        increment_yabeda_metrics(event)
        broadcast!(event)
        
        # Send to Mixpanel (async)
        track_mixpanel(event) if should_track_mixpanel?

        return Result.new(ok: true, event: event)
      end
    rescue => e
      Rails.logger.error("[Analytics] TrackEventService error: #{e.class} #{e.message}")
      Result.new(ok: false, error: e.message)
    end

    private

    WHITELIST_KEYS = %w[
      utm_source utm_medium utm_campaign utm_term utm_content
      referrer path item_id ip user_agent viewport source placement
      variant button_variant rating lead_id product_id status city state
      activation_time previous_status method distributed_to_count company_ids
      query results_count category_id
    ].freeze

    def sanitize_metadata(meta)
      return {} unless meta.is_a?(Hash)
      
      # Convert all keys to string for consistency
      meta = meta.stringify_keys
      
      # Extract UTM parameters if they are nested
      if meta['utm'].is_a?(Hash)
        meta.merge!(meta['utm'].stringify_keys)
      end

      # Slice by whitelist
      meta.slice(*WHITELIST_KEYS).compact
    end

    def authorize!(company)
      # Internal/system events (e.g. created via callbacks/jobs)
      return if @user.nil?
      return if @user.respond_to?(:admin?) && @user.admin?
      return if @user.respond_to?(:review_user?) && @user.review_user?

      if @user.respond_to?(:company_user?) && @user.company_user?
        raise Pundit::NotAuthorizedError, 'Forbidden' unless @user.company_id == company.id
        return
      end

      # For other users, we might want to allow them to track events like profile views
      # but we should be careful. For now, let's follow the original logic.
      # If they are just a regular user, they can track events.
    end

    def increment_daily_stat!(event)
      col = EVENT_TO_DAILY_COLUMN[event.event_type]
      return unless col

      day = event.tracked_at.to_date
      
      CompanyDailyStat.transaction do
        stat = CompanyDailyStat.lock.find_or_create_by!(company_id: event.company_id, day: day)
        stat.update_column(col, stat.public_send(col).to_i + 1)
      end
    end

    def increment_company_counters(company)
      counter = EVENT_TO_COMPANY_COUNTER[@event_type]
      return unless counter

      Company.increment_counter(counter, company.id)
    end

    def increment_yabeda_metrics(event)
      return unless defined?(Yabeda)

      Yabeda.ab0.analytics_events_total.increment({ event_type: event.event_type }, by: 1)
      
      if event.event_type == 'profile_view'
        Yabeda.ab0.company_views_total.increment({ company_id: event.company_id }, by: 1)
      end
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
          environment: Rails.env,
          platform: 'backend',
          server_timestamp: event.tracked_at.to_i,
          **event.metadata
        }
      )
    rescue => e
      Rails.logger.warn("[Analytics] Mixpanel job enqueue failed: #{e.message}")
    end
  end
end
