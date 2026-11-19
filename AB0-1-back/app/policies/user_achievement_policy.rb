# frozen_string_literal: true

# Conquistas só mudam de estado por ações auditadas (revoke/reinstate/manual_grant).
# CRUD direto e exclusão física ficam bloqueados para preservar o histórico.
class UserAchievementPolicy < ApplicationPolicy
  def create?
    false
  end

  def update?
    false
  end

  def destroy?
    false
  end

  def revoke?
    admin?
  end

  def reinstate?
    admin?
  end

  def manual_grant?
    admin?
  end
end
