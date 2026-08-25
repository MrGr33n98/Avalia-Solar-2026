# frozen_string_literal: true

class GroupPostPolicy < ApplicationPolicy
  def show?
    return false unless Groups::Feature.enabled? && GroupPolicy.new(user, record.group).show?
    return true if moderate?

    record.status == 'published'
  end

  def create?
    Groups::Feature.enabled? && GroupPolicy.new(user, record.group).create_post?
  end

  def update?
    Groups::Feature.enabled? && (author? || moderate?) && record.status != 'removed'
  end

  def destroy?
    Groups::Feature.enabled? && (author? || moderate?) && record.status != 'removed'
  end

  def moderate?
    Groups::Feature.enabled? && can_moderate?
  end

  def hide?
    moderate?
  end

  def restore?
    moderate?
  end

  def pin?
    moderate?
  end

  def unpin?
    moderate?
  end

  def close_comments?
    moderate?
  end

  def open_comments?
    moderate?
  end

  class Scope < Scope
    def resolve
      return scope.none unless Groups::Feature.enabled?

      visible_groups = GroupPolicy::Scope.new(user, Group).resolve.select(:id)
      scope.where(group_id: visible_groups, status: 'published')
    end
  end

  private

  def author?
    user.is_a?(User) && record.user_id == user.id
  end

  def can_moderate?
    GroupPolicy.new(user, record.group).moderate?
  end
end