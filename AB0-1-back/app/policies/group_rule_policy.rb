# frozen_string_literal: true

class GroupRulePolicy < ApplicationPolicy
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
      GroupRule.joins(:group).merge(GroupPolicy::Scope.new(user, Group).resolve).where(active: true)
    end
  end
end
