# frozen_string_literal: true

module Api
  module V1
    module Achievements
      class VerificationsController < BaseController
        skip_before_action :authenticate_api_user, raise: false

        # GET /api/v1/achievements/verify/:token
        def show
          user_achievement = ::UserAchievement.includes(:user, :achievement_badge)
                                              .find_by(share_token: params[:token])

          if user_achievement.nil?
            return render json: {
              status: 'not_found',
              error: 'Certificado de conquista não encontrado ou inválido.'
            }, status: :not_found
          end

          if user_achievement.revoked?
            return render json: {
              status: 'revoked',
              error: 'Esta conquista foi revogada pela moderação.',
              badge_name: user_achievement.achievement_badge.name,
              revoked_at: user_achievement.revoked_at&.iso8601
            }, status: :gone
          end

          badge = user_achievement.achievement_badge
          user = user_achievement.user
          display_name = user.name.presence || [user.first_name, user.last_name].compact.join(' ').presence || 'Avaliador Solar'

          base_url = request.base_url

          render json: {
            status: 'valid',
            badge: {
              slug: badge.slug,
              name: badge.name,
              description: badge.description,
              criteria_description: badge.criteria_description,
              tier: badge.tier,
              category: badge.category,
              icon_url: "/assets/achievements/cards/#{badge.slug}.svg",
              points: badge.points
            },
            recipient: {
              display_name: mask_display_name(display_name),
              member_since: user.created_at&.strftime('%m/%Y')
            },
            verification: {
              token: user_achievement.share_token,
              unlocked_at: user_achievement.unlocked_at.iso8601,
              verified_at: Time.current.iso8601,
              authenticity_url: "#{base_url}/conquistas/verificar/#{user_achievement.share_token}"
            }
          }, status: :ok
        end

        private

        def mask_display_name(name)
          parts = name.strip.split(/\s+/)
          return name if parts.empty?
          return parts.first if parts.size == 1

          "#{parts.first} #{parts.last[0]}."
        end
      end
    end
  end
end
