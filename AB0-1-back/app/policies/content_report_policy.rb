# frozen_string_literal: true

class ContentReportPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def create?
    return false unless user.present?
    return true unless record.is_a?(ContentReport)

    # If associated with a group, user must be active member
    if record.group
      membership = record.group.active_membership_for(user)
      return false unless membership.present?
    end

    true
  end

  def update?
    return false unless user.present?
    return true if admin?

    if record.group
      membership = record.group.active_membership_for(user)
      return true if membership.present? && membership.role.in?(%w[moderator admin owner])
    end

    false
  end

  def destroy?
    update?
  end

  class Scope < Scope
    def resolve
      return scope.none unless user.present?
      return scope.all if admin?

      # Find groups where user has staff privileges
      moderated_group_ids = user.group_memberships
                                .where(status: 'active', role: %w[moderator admin owner])
                                .pluck(:group_id)

      scope.where(group_id: moderated_group_ids)
    end
  end
end
