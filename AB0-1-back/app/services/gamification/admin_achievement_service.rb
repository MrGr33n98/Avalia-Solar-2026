# frozen_string_literal: true

module Gamification
  # Operações administrativas sobre conquistas (concessão manual, revogação e
  # restabelecimento) executadas pelo ActiveAdmin.
  #
  # Garantias:
  # - Auditoria: toda transição aplicada gera exatamente um registro no ledger
  #   com o administrador responsável (`admin_user_id`) e a justificativa (`reason`).
  # - Idempotência: a linha de `user_achievements` é bloqueada (SELECT ... FOR UPDATE)
  #   e o estado é revalidado dentro da transação; repetir a mesma requisição vira
  #   no-op. A chave de idempotência deriva do `lock_version` anterior à transição,
  #   então requisições concorrentes da mesma transição colidem no índice único.
  # - XP sem duplicidade: o delta é calculado a partir do saldo líquido do ledger
  #   para o par usuário/conquista (alvo = points_xp quando ativa, 0 quando revogada).
  # - Sem exclusão física: o serviço apenas muda estado e acrescenta lançamentos.
  class AdminAchievementService
    MIN_REASON_LENGTH = 20
    REASON_ERROR = "A justificativa deve conter no mínimo #{MIN_REASON_LENGTH} caracteres.".freeze
    INVALID_TARGET_ERROR = 'Usuário ou conquista inválida.'

    Result = Struct.new(:status, :user_achievement, :ledger, :error, keyword_init: true) do
      def applied?
        status == :applied
      end

      def noop?
        status == :noop
      end

      def invalid?
        status == :invalid
      end
    end

    def initialize(admin_user:)
      @admin_user = admin_user
    end

    def revoke(user_achievement, reason:)
      transition(user_achievement, reason: reason, kind: 'manual_revoke', from: 'unlocked', &:revoke!)
    end

    def reinstate(user_achievement, reason:)
      transition(user_achievement, reason: reason, kind: 'reinstated', from: 'revoked', &:reinstate!)
    end

    def grant(user:, badge:, reason:)
      return invalid(INVALID_TARGET_ERROR) if user.nil? || badge.nil?
      return invalid(REASON_ERROR) unless valid_reason?(reason)

      existing = UserAchievement.find_by(user: user, achievement_badge: badge)
      return transition(existing, reason: reason, kind: 'manual_grant', from: 'revoked', &:reinstate!) if existing

      create_granted(user, badge, reason)
    rescue ActiveRecord::RecordNotUnique
      # Corrida entre duas concessões simultâneas: a outra requisição já criou a conquista.
      noop(UserAchievement.find_by(user: user, achievement_badge: badge))
    rescue ActiveRecord::RecordInvalid
      existing_after_race = UserAchievement.find_by(user: user, achievement_badge: badge)
      raise unless existing_after_race

      noop(existing_after_race)
    end

    private

    def transition(user_achievement, reason:, kind:, from:)
      return invalid(REASON_ERROR) unless valid_reason?(reason)

      user_achievement.with_lock do
        next noop(user_achievement) unless user_achievement.state == from

        version = user_achievement.lock_version
        yield user_achievement
        applied(user_achievement, record!(user_achievement, kind, reason, version))
      end
    rescue ActiveRecord::RecordNotUnique
      noop(user_achievement.reload)
    end

    def create_granted(user, badge, reason)
      ActiveRecord::Base.transaction do
        user_achievement = UserAchievement.create!(user: user, achievement_badge: badge, state: 'unlocked')
        applied(user_achievement, record!(user_achievement, 'manual_grant', reason, 0))
      end
    end

    def record!(user_achievement, kind, reason, version)
      AchievementLedger.create!(
        user_id: user_achievement.user_id,
        achievement_badge_id: user_achievement.achievement_badge_id,
        kind: kind,
        xp_delta: xp_delta_for(user_achievement, kind),
        admin_user: @admin_user,
        reason: reason.to_s.strip,
        idempotency_key: idempotency_key(user_achievement, kind, version)
      )
    end

    def xp_delta_for(user_achievement, kind)
      target = kind == 'manual_revoke' ? 0 : user_achievement.achievement_badge.points_xp
      current = AchievementLedger.where(
        user_id: user_achievement.user_id,
        achievement_badge_id: user_achievement.achievement_badge_id
      ).sum(:xp_delta)

      target - current
    end

    def idempotency_key(user_achievement, kind, version)
      "admin:#{kind}:user:#{user_achievement.user_id}:badge:#{user_achievement.achievement_badge_id}:v#{version}"
    end

    def valid_reason?(reason)
      reason.to_s.strip.length >= MIN_REASON_LENGTH
    end

    def applied(user_achievement, ledger)
      Result.new(status: :applied, user_achievement: user_achievement, ledger: ledger)
    end

    def noop(user_achievement)
      Result.new(status: :noop, user_achievement: user_achievement)
    end

    def invalid(error)
      Result.new(status: :invalid, error: error)
    end
  end
end
