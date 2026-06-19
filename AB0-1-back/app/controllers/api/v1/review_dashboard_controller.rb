# frozen_string_literal: true

module Api
  module V1
    class ReviewDashboardController < BaseController
      before_action :authenticate_api_user
      before_action :require_review_role

      # GET /api/v1/review_dashboard/summary
      def summary
        start_time = Time.current
        start_date = 30.days.ago.beginning_of_day
        end_date = Time.current

        # KPIs
        user_leads = Lead.where(email: current_user.email)
        quotes_total = safe_count(user_leads)
        quotes_open = safe_count(user_leads.where(wizard_status: %w[draft pending_otp verified]))
        quotes_replied = safe_count(user_leads.where(wizard_status: 'proposal_sent'))
        reviews_published = safe_count(Review.where(user_id: current_user.id, status: :approved))

        # Charts Data - Real activity data from AnalyticsEvent
        chart_data = safe_activity_chart(start_date: start_date, end_date: end_date)

        # Profile Completion
        missing_fields = []
        missing_fields << 'avatar' unless avatar_attached?
        missing_fields << 'city' if current_user.city.blank?
        missing_fields << 'state' if current_user.state.blank?

        completion_percent = 100
        completion_percent -= 20 unless avatar_attached?
        completion_percent -= 20 if current_user.city.blank?
        completion_percent -= 10 if current_user.state.blank?

        # Performance monitoring
        duration_ms = ((Time.current - start_time) * 1000).round(2)
        Rails.logger.info({
          event: 'api_performance',
          endpoint: 'review_dashboard#summary',
          duration_ms: duration_ms,
          user_id: current_user.id,
          timestamp: Time.current.iso8601
        }.to_json)

        render json: {
          kpis: {
            quotes_total: quotes_total,
            quotes_open: quotes_open,
            quotes_replied: quotes_replied,
            reviews_published: reviews_published
          },
          charts: {
            activity_30d: chart_data
          },
          profile: {
            completion_percent: completion_percent,
            missing_fields: missing_fields
          }
        }
      rescue StandardError => e
        Rails.logger.error("[ReviewDashboard] summary failed user=#{current_user&.id}: #{e.class} #{e.message}")
        render json: fallback_summary, status: :ok
      end

      private

      def require_review_role
        require_role('review')
      end

      def safe_count(scope)
        scope.count
      rescue StandardError => e
        Rails.logger.error("[ReviewDashboard] count failed: #{e.class} #{e.message}")
        0
      end

      def safe_activity_chart(start_date:, end_date:)
        Rails.cache.fetch(
          "review_dashboard:activity:#{current_user.id}",
          expires_in: 1.hour
        ) do
          ReviewDashboard::ActivityService
            .new(user: current_user)
            .activity_chart_data(start_date: start_date, end_date: end_date)
        end
      rescue StandardError => e
        Rails.logger.error("[ReviewDashboard] activity chart failed: #{e.class} #{e.message}")
        empty_activity_chart(start_date: start_date, end_date: end_date)
      end

      def empty_activity_chart(start_date:, end_date:)
        (start_date.to_date..end_date.to_date).map do |date|
          {
            date: date.to_s,
            profile_views: 0,
            whatsapp_clicks: 0,
            cta_clicks: 0
          }
        end
      end

      def avatar_attached?
        current_user.respond_to?(:avatar) && current_user.avatar.attached?
      rescue StandardError
        false
      end

      def fallback_summary
        {
          kpis: {
            quotes_total: 0,
            quotes_open: 0,
            quotes_replied: 0,
            reviews_published: 0
          },
          charts: {
            activity_30d: empty_activity_chart(
              start_date: 30.days.ago.beginning_of_day,
              end_date: Time.current
            )
          },
          profile: {
            completion_percent: 0,
            missing_fields: %w[avatar city state]
          }
        }
      end
    end
  end
end
