# frozen_string_literal: true

module Gamification
  class ReevaluateUserJob < ApplicationJob
    queue_as :default

    def perform(user_id, trigger_cause = nil)
      result = Gamification::EvaluateAchievementsService.call(
        user_id: user_id,
        trigger_cause: trigger_cause
      )

      return unless result.success?

      notify_unlocked_achievements(result)
    end

    private

    def notify_unlocked_achievements(result)
      return if result.unlocked_badges.blank?

      result.unlocked_badges.each do |badge|
        user_achievement = result.user.user_achievements.find_by(achievement_badge_id: badge.id)
        next unless user_achievement

        AchievementUnlockedNotifier.with(
          achievement_badge: badge,
          user_achievement: user_achievement
        ).deliver_later(result.user)
      rescue StandardError => e
        Rails.logger.error("[Gamification] Falha ao entregar notificação do selo #{badge.slug}: #{e.message}")
      end
    end
  end
end
