# frozen_string_literal: true

class CommentPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    return false unless user.present?
    return true unless record.is_a?(Comment)

    commentable = record.commentable
    if commentable.is_a?(GroupPost)
      group = commentable.group
      return false unless group.status == 'active'

      membership = group.active_membership_for(user)
      return false unless membership.present?

      return false unless commentable.status == 'published'
      return false unless commentable.comments_enabled?
    end

    true
  end

  def update?
    user.present? && record.user_id == user.id
  end

  def destroy?
    return false unless user.present?

    return true if record.user_id == user.id || admin?

    if record.commentable.is_a?(GroupPost)
      group = record.commentable.group
      membership = group.active_membership_for(user)
      return true if membership.present? && membership.role.in?(%w[moderator admin owner])
    end

    false
  end
end
