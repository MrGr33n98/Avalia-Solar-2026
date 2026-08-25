# frozen_string_literal: true

class GroupTopicPolicy < ApplicationPolicy
  def index?
    GroupPolicy.new(user, record.group).show?
  end

  def create?
    GroupPolicy.new(user, record.group).manage_members?
  end

  def update?
    create?
  end

  def destroy?
    create?
  end

  class Scope < Scope
    def resolve
      GroupTopic.joins(:group).merge(GroupPolicy::Scope.new(user, Group).resolve).where(active: true)
    end
  end
end
