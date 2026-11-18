# frozen_string_literal: true

module Api
  module V1
    class GamificationController < BaseController
      before_action :authenticate_api_user
      before_action :require_review_role

      # GET /api/v1/gamification/summary
      def summary
        green_score = current_user.calculate_green_score
        regional_ranking = current_user.regional_ranking(score: green_score)
        read_model = Gamification::ReadModelService.new(user: current_user).call

        render json: {
          green_score: green_score,
          regional_ranking: regional_ranking,
          achievements: read_model[:achievements],
          earned_points: read_model.dig(:summary, :xp_total) || 0,
          level: current_user.gamification_level
        }
      rescue StandardError => e
        Rails.logger.error("[Gamification] summary failed user=#{current_user&.id}: #{e.class} #{e.message}")
        render json: {
          error: 'Não foi possível carregar o resumo da gamificação.',
          code: 'gamification_summary_unavailable'
        }, status: :service_unavailable
      end

      private

      def require_review_role
        require_role('review', 'admin')
      end
    end
  end
end
