# frozen_string_literal: true

module Api
  module V1
    class ReviewDashboardController < BaseController
      before_action :authenticate_api_user
      before_action :require_review_role

      # GET /api/v1/review_dashboard/summary
      def summary
        start_date = 30.days.ago.beginning_of_day
        end_date = Time.current

        # KPIs
        quotes_total = Lead.where(email: current_user.email).count
        quotes_open = Lead.where(email: current_user.email).where(wizard_status: %w[draft pending_otp
                                                                                    verified]).count
        quotes_replied = Lead.where(email: current_user.email).where(wizard_status: 'proposal_sent').count
        reviews_published = Review.where(user_id: current_user.id, status: :approved).count

        # Charts Data (Last 30 days activity)
        # Assuming activity means views/clicks on companies they interacted with or general activity
        # For simplicity, we'll return daily counts of their leads and reviews created
        daily_leads = Lead.where(email: current_user.email)
                          .where(created_at: start_date..end_date)
                          .group('DATE(created_at)')
                          .count

        Review.where(user_id: current_user.id)
              .where(created_at: start_date..end_date)
              .group('DATE(created_at)')
              .count

        # Format chart data
        chart_data = (start_date.to_date..end_date.to_date).map do |date|
          {
            date: date.to_s,
            profile_views: 0, # Placeholder or fetch from AnalyticsEvent if relevant
            whatsapp_clicks: 0, # Placeholder
            cta_clicks: daily_leads[date] || 0
          }
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
