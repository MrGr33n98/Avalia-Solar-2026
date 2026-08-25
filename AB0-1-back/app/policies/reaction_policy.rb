# frozen_string_literal: true

class ReactionPolicy < ApplicationPolicy
  def create?
    return false unless user.present?
    return true unless record.is_a?(Reaction)

    reactable = record.reactable
    if reactable.is_a?(GroupPost)
      group = reactable.group
      return false unless group.status == 'active'

      membership = group.active_membership_for(user)
      return false unless membership.present?

      return false unless reactable.status == 'published'
    end

    true
  end

  def destroy?
    return false unless user.present?
    return true unless record.is_a?(Reaction)

    return true if record.user_id == user.id || admin?

    if record.reactable.is_a?(GroupPost)
      group = record.reactable.group
      membership = group.active_membership_for(user)
      return true if membership.present? && membership.role.in?(%w[moderator admin owner])
    end

    false
  end
end
