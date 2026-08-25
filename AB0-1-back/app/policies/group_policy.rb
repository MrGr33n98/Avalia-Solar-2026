# frozen_string_literal: true

class GroupPolicy < ApplicationPolicy
  def index?
    Groups::Feature.enabled?
  end

  def show?
    return false unless Groups::Feature.enabled?
    return true if admin?
    return true if record.visibility == 'public' && record.status == 'active'

    record.status == 'active' && active_membership?
  end

  def create?
    Groups::Feature.enabled? && user.present? && user.is_a?(User) && user.active?
  end

  def update?
    owner_or_admin?
  end

  def destroy?
    owner_or_admin?
  end

  def join?
    Groups::Feature.enabled? && user.present? && record.status == 'active' && record.visibility != 'private_hidden'
  end

  def leave?
    Groups::Feature.enabled? && active_membership? && record.owner_id != user.id
  end

  def invite?
    active_membership? && !member_role?
  end

  def manage_members?
    owner_or_admin? || moderator_role?
  end

  def moderate?
    owner_or_admin? || moderator_role?
  end

  class Scope < Scope
    def resolve
      return scope.none unless Groups::Feature.enabled?
      return scope.all if admin?
      return scope.where(status: 'active', visibility: 'public') unless user

      scope.where(status: 'active', visibility: 'public').or(
        scope.where(id: visible_private_ids, status: 'active')
      )
    end

    def resolve_for_join
      return scope.none unless Groups::Feature.enabled? && user

      scope.where(status: 'active', visibility: %w[public private_visible])
    end

    private

    def admin?
      user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)
    end

    def visible_private_ids
      GroupMembership.where(user_id: user.id, status: 'active').select(:group_id)
    end
  end

  private

  def membership
    @membership ||= GroupMembership.find_by(group_id: record.id, user_id: user&.id)
  end

  def active_membership?
    !!(membership&.active?)
  end

  def owner_or_admin?
    admin? || (user.present? && record.owner_id == user.id)
  end

  def moderator_role?
    membership&.active? && membership.role.in?(%w[moderator admin owner])
  end

  def member_role?
    membership&.role == 'member'
  end
end