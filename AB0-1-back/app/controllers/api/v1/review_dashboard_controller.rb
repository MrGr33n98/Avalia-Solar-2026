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
        quotes_total = Lead.where(email: current_user.email).count
        quotes_open = Lead.where(email: current_user.email).where(wizard_status: %w[draft pending_otp
                                                                                    verified]).count
        quotes_replied = Lead.where(email: current_user.email).where(wizard_status: 'proposal_sent').count
        reviews_published = Review.where(user_id: current_user.id, status: :approved).count

        # Charts Data - Real activity data from AnalyticsEvent
        activity_service = ReviewDashboard::ActivityService.new(user: current_user)
        chart_data = Rails.cache.fetch(
          "review_dashboard:activity:#{current_user.id}",
          expires_in: 1.hour
        ) do
          activity_service.activity_chart_data(start_date: start_date, end_date: end_date)
        end

        # Profile Completion
        missing_fields = []
        missing_fields << 'avatar' unless current_user.avatar.attached?
        missing_fields << 'city' if current_user.city.blank?
        missing_fields << 'state' if current_user.state.blank?

        completion_percent = 100
        completion_percent -= 20 if current_user.avatar.blank?
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
      end

      private

      def require_review_role
        require_role('review')
      end
    end
  end
end
