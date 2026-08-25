# frozen_string_literal: true

class GroupMembershipPolicy < ApplicationPolicy
  def show?
    user.present? && (record.user_id == user.id || GroupPolicy.new(user, record.group).manage_members?)
  end

  def create?
    GroupPolicy.new(user, record.group).join?
  end

  def update?
    GroupPolicy.new(user, record.group).manage_members?
  end

  def destroy?
    user.present? && record.user_id == user.id && record.role != 'owner'
  end

  class Scope < Scope
    def resolve
      return scope.none unless user
      return scope.all if user.respond_to?(:admin?) && user.admin?

      scope.where(user_id: user.id).or(scope.where(group_id: GroupPolicy::Scope.new(user, Group).resolve.select(:id)))
    end
  end
end