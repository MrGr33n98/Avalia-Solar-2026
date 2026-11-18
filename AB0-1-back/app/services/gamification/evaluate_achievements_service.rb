# frozen_string_literal: true

module Gamification
  class EvaluateAchievementsService
    Result = Struct.new(
      :success?,
      :user,
      :unlocked_badges,
      :revoked_badges,
      :reinstated_badges,
      :total_xp,
      :error,
      keyword_init: true
    )

    def self.call(user_id:, trigger_cause: nil)
      new(user_id: user_id, trigger_cause: trigger_cause).call
    end

    def initialize(user_id:, trigger_cause: nil)
      @user_id = user_id
      @trigger_cause = trigger_cause
      @unlocked_badges = []
      @revoked_badges = []
      @reinstated_badges = []
    end

    def call
      User.transaction do
        user = User.lock('FOR UPDATE').find_by(id: @user_id)
        return Result.new(success?: false, error: 'User not found') unless user

        evaluate_user_badges(user)
        build_success_result(user)
      end
    rescue StandardError => e
      log_error(e)
      Result.new(success?: false, error: e.message)
    end

    private

    def evaluate_user_badges(user)
      AchievementBadge.active.ordered.each do |badge|
        rule = Rules::Registry.for(badge)
        next unless rule

        evaluate_single_badge(user, badge, rule)
      end
    end

    def evaluate_single_badge(user, badge, rule)
      eligible, fact_at = rule.evaluate(user)
      user_achievement = user.user_achievements.find_by(achievement_badge_id: badge.id)

      if eligible
        handle_eligible(user, badge, user_achievement, fact_at)
      elsif user_achievement&.unlocked? && badge.revocable?
        handle_ineligible(user, badge, user_achievement)
      end
    end

    def handle_eligible(user, badge, user_achievement, fact_at)
      if user_achievement.nil?
        unlock_badge(user, badge, fact_at)
      elsif user_achievement.revoked?
        reinstate_badge(user, badge, user_achievement)
      end
    end

    def unlock_badge(user, badge, fact_at)
      user.user_achievements.create!(
        achievement_badge: badge,
        state: 'unlocked',
        unlocked_at: fact_at || Time.current
      )

      record_ledger(
        user: user,
        badge: badge,
        kind: 'unlocked',
        xp_delta: badge.points_xp,
        idempotency_key: "user:#{user.id}:badge:#{badge.slug}:unlock"
      )

      @unlocked_badges << badge
    end

    def reinstate_badge(user, badge, user_achievement)
      user_achievement.reinstate!

      record_ledger(
        user: user,
        badge: badge,
        kind: 'reinstated',
        xp_delta: badge.points_xp,
        idempotency_key: "user:#{user.id}:badge:#{badge.slug}:reinstate:#{Time.current.to_i}"
      )

      @reinstated_badges << badge
    end

    def handle_ineligible(user, badge, user_achievement)
      user_achievement.revoke!

      record_ledger(
        user: user,
        badge: badge,
        kind: 'revoked',
        xp_delta: -badge.points_xp,
        idempotency_key: "user:#{user.id}:badge:#{badge.slug}:revoke:#{Time.current.to_i}"
      )

      @revoked_badges << badge
    end

    def record_ledger(user:, badge:, kind:, xp_delta:, idempotency_key:)
      AchievementLedger.create!(
        user: user,
        achievement_badge: badge,
        kind: kind,
        xp_delta: xp_delta,
        idempotency_key: idempotency_key,
        reason: "Transição #{kind} para #{badge.slug}"
      )
    rescue ActiveRecord::RecordNotUnique
      Rails.logger.warn("[Gamification] Idempotency key conflict: #{idempotency_key}")
    end

    def build_success_result(user)
      Result.new(
        success?: true,
        user: user,
        unlocked_badges: @unlocked_badges,
        revoked_badges: @revoked_badges,
        reinstated_badges: @reinstated_badges,
        total_xp: user.total_achievement_xp
      )
    end

    def log_error(err)
      Rails.logger.error("[Gamification] Evaluate failed for user #{@user_id}: #{err.message}")
    end
  end
end
