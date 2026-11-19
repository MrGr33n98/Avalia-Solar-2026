# frozen_string_literal: true

class AchievementLedgerPolicy < ApplicationPolicy
  def create?
    false
  end

  def update?
    false
  end

  def destroy?
    false
  end
end
