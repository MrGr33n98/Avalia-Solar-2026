# frozen_string_literal: true

module ReviewDashboard
  class ActivityService
    attr_reader :user

    def initialize(user:)
      @user = user
    end

    def activity_chart_data(start_date: 30.days.ago, end_date: Time.current)
      start_date = start_date.beginning_of_day
      end_date = end_date.end_of_day

      # Aggregate analytics events by date
      profile_views = aggregate_events('profile_view', start_date, end_date)
      whatsapp_clicks = aggregate_events('whatsapp_click', start_date, end_date)
      cta_clicks = aggregate_events('cta_click', start_date, end_date)

      # Generate daily data points
      (start_date.to_date..end_date.to_date).map do |date|
        {
          date: date.to_s,
          profile_views: profile_views[date] || 0,
          whatsapp_clicks: whatsapp_clicks[date] || 0,
          cta_clicks: cta_clicks[date] || 0
        }
      end
    end

    private

    def aggregate_events(event_type, start_date, end_date)
      # Get companies that user owns reviews for
      company_ids = Review.where(user_id: user.id).distinct.pluck(:company_id)

      return {} if company_ids.empty?

      # Aggregate events by date
      AnalyticsEvent
        .where(event_type: event_type)
        .where(company_id: company_ids)
        .where(created_at: start_date..end_date)
        .group('DATE(created_at)')
        .count
        .transform_keys { |date_value| normalize_grouped_date(date_value) }
        .compact
    rescue StandardError => e
      Rails.logger.error("[ReviewDashboard] activity aggregate failed: #{e.class} #{e.message}")
      {}
    end

    def normalize_grouped_date(value)
      case value
      when Date
        value
      when Time, DateTime
        value.to_date
      else
        Date.parse(value.to_s)
      end
    rescue StandardError
      nil
    end
  end
end
