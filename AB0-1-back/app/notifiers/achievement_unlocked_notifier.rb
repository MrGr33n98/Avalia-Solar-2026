# frozen_string_literal: true

class AchievementUnlockedNotifier < ApplicationNotifier
  required_param :achievement_badge
  required_param :user_achievement

  def message
    badge = params[:achievement_badge]
    "Parabéns! Você desbloqueou a conquista '#{badge.name}' (+#{badge.points_xp} XP)."
  end

  def url
    '/review-dashboard/achievements'
  end
end
