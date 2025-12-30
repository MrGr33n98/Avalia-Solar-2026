# frozen_string_literal: true

module Analytics
  class TrackEventService
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

    def self.call(company_id:, event_type:, metadata: {}, user: nil, tracked_at: nil)
      new(company_id:, event_type:, metadata:, user:, tracked_at:).call
    end

    def initialize(company_id:, event_type:, metadata:, user:, tracked_at:)
      @company_id = company_id
      @event_type = event_type.to_s
      @metadata = metadata.is_a?(Hash) ? metadata : {}
      @user = user
      @tracked_at = tracked_at.presence || Time.current
    end

    def call
      company = Company.find(@company_id)
      authorize!(company)

      event = AnalyticsEvent.create!(
        company_id: company.id,
        user_id: @user&.id,
        event_type: @event_type,
        metadata: normalized_metadata,
        tracked_at: @tracked_at
      )

      if defined?(Yabeda)
        Yabeda.ab0.analytics_events_total.increment({ event_type: @event_type }, by: 1)
        if @event_type == 'profile_view'
          Yabeda.ab0.company_views_total.increment({ company_id: company.id }, by: 1)
        end
      end

      increment_company_counters(company)
      increment_daily_stats(company)

      broadcast(company, event)

      event
    end

    private

    def authorize!(company)
      # Internal/system events (e.g. created via callbacks/jobs)
      return if @user.nil?

      return if @user&.admin? || @user&.review_user?

      if @user&.company_user?
        raise Pundit::NotAuthorizedError, 'Forbidden' unless @user.company_id == company.id
        return
      end

      raise Pundit::NotAuthorizedError, 'Unauthorized'
    end

    def normalized_metadata
      meta = @metadata.deep_dup

      # Common keys (best-effort):
      # - referrer
      # - utm_source / utm_medium / utm_campaign
      # - path
      # - user_agent
      meta
    end

    def increment_company_counters(company)
      counter = EVENT_TO_COMPANY_COUNTER[@event_type]
      return unless counter

      Company.increment_counter(counter, company.id)
    end

    def increment_daily_stats(company)
      col = EVENT_TO_DAILY_COLUMN[@event_type]
      return unless col

      day = @tracked_at.to_date

      CompanyDailyStat.transaction do
        stat = CompanyDailyStat.lock.find_or_create_by!(company_id: company.id, day: day)
        stat.update_column(col, stat.public_send(col).to_i + 1)
      end
    end

    def broadcast(company, event)
      ActionCable.server.broadcast(
        "company:#{company.id}:dashboard",
        {
          type: 'analytics_event',
          event_type: event.event_type,
          tracked_at: event.tracked_at,
          company_id: company.id
        }
      )
    rescue StandardError => e
      Rails.logger.warn("[Analytics] broadcast failed: #{e.message}")
    end
  end
end

# Zeitwerk compatibility: file name expects AnalyticsTrackEventService constant.
AnalyticsTrackEventService = Analytics::TrackEventService
