# frozen_string_literal: true

module Analytics
  class TrackEventService
    Result = Struct.new(:ok, :event, :error, keyword_init: true)

    def initialize(company_id:, user_id:, event_type:, source: nil, metadata: {}, occurred_at: Time.current)
      @company_id = company_id
      @user_id = user_id
      @event_type = event_type.to_s
      @source = source
      @metadata = sanitize_metadata(metadata)
      @occurred_at = occurred_at
    end

    def call
      return Result.new(ok: false, error: 'event_type missing') if @event_type.blank?

      ActiveRecord::Base.transaction do
        event = AnalyticsEvent.create!(
          company_id: @company_id,
          user_id: @user_id,
          event_type: @event_type,
          source: @source,
          metadata: @metadata,
          tracked_at: @occurred_at
        )

        upsert_daily_stat!(event)
        increment_metrics!(event)
        broadcast!(event)

        return Result.new(ok: true, event: event)
      end
    rescue => e
      Rails.logger.error("[Analytics] TrackEventService error: #{e.class} #{e.message}")
      Result.new(ok: false, error: e.message)
    end

    private

    WHITELIST_KEYS = %w[utm_source utm_medium utm_campaign referrer path item_id].freeze

    def sanitize_metadata(meta)
      return {} unless meta.is_a?(Hash)
      meta.slice(*WHITELIST_KEYS)
    end

    def upsert_daily_stat!(event)
      return unless event.company_id.present?
      day = event.tracked_at.to_date
      stat = CompanyDailyStat.find_or_initialize_by(company_id: event.company_id, day: day)
      stat.events_count = stat.events_count.to_i + 1
      case event.event_type
      when 'quote_click' then stat.quote_clicks = stat.quote_clicks.to_i + 1
      when 'whatsapp_click' then stat.whatsapp_clicks = stat.whatsapp_clicks.to_i + 1
      when 'review_created'
        stat.reviews_count = stat.reviews_count.to_i + 1
        rating = (@metadata['rating'].to_f if @metadata)
        if rating && rating.positive?
          total = stat.rating_count.to_i + 1
          stat.average_rating = ((stat.average_rating.to_f * stat.rating_count.to_i) + rating) / total
          stat.rating_count = total
        end
      end
      stat.save!
    end

    def increment_metrics!(event)
      # yabeda custom counter
      ab0_analytics_events_total.increment({ event_type: event.event_type })
    end

    def broadcast!(event)
      return unless event.company_id.present?
      payload = {
        type: event.event_type,
        source: event.source,
        company_id: event.company_id,
        tracked_at: event.tracked_at.iso8601,
        meta: event.metadata,
        counters: CompanyDailyStat.find_by(company_id: event.company_id, day: event.tracked_at.to_date)&.slice(
          :events_count, :quote_clicks, :whatsapp_clicks, :reviews_count, :average_rating, :rating_count
        )
      }
      ActionCable.server.broadcast("company:#{event.company_id}:dashboard", payload)
    end
  end
end
