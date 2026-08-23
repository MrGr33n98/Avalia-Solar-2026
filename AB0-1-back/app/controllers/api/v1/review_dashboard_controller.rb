# frozen_string_literal: true

module Api
  module V1
    class ReviewDashboardController < BaseController
      before_action :authenticate_api_user
      before_action :require_review_role

      # GET /api/v1/review_dashboard/summary
      def summary
        render json: ReviewDashboard::SummaryService.new(
          user: current_user,
          request_id: request.request_id
        ).call, headers: { 'X-Request-ID' => request.request_id }
      rescue StandardError => e
        Rails.logger.error({
          event: 'review_dashboard_summary_failed',
          user_id: current_user&.id,
          request_id: request.request_id,
          error_class: e.class.name,
          message: e.message
        }.to_json)
        render json: {
          error: {
            code: 'REVIEW_DASHBOARD_SUMMARY_UNAVAILABLE',
            message: 'Não foi possível carregar o resumo do dashboard.',
            request_id: request.request_id
          }
        }, status: :service_unavailable, headers: { 'X-Request-ID' => request.request_id }
      end

      private

      def require_review_role
        require_role('review', 'admin')
      end

    end
  end
end
