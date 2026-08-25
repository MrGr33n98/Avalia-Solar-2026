# frozen_string_literal: true

class GroupMembershipPolicy < ApplicationPolicy
  def show?
    Groups::Feature.enabled? && user.present? &&
      (record.user_id == user.id || GroupPolicy.new(user, record.group).manage_members?)
  end

  def create?
    GroupPolicy.new(user, record.group).join?
  end

  def update?
    Groups::Feature.enabled? && GroupPolicy.new(user, record.group).manage_members?
  end

  def destroy?
    Groups::Feature.enabled? && user.present? && record.user_id == user.id && record.role != 'owner' && record.active?
  end

  class Scope < Scope
    def resolve
      return scope.none unless user
      return scope.all if user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)

      visible_group_ids = GroupPolicy::Scope.new(user, Group).resolve.select(:id)
      scope.where(user_id: user.id).or(scope.where(group_id: visible_group_ids))
    end
  end
end