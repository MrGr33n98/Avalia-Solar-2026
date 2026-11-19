# frozen_string_literal: true

class UserAchievementPolicy < ApplicationPolicy
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
