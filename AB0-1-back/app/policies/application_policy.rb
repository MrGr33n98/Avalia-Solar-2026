# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def admin?
    user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)
  end

  def index?
    admin?
  end

  def show?
    admin?
  end

  def create?
    admin?
  end

  def new?
    create?
  end

  def update?
    admin?
  end

  def edit?
    update?
  end

  def destroy?
    admin?
  end

  def user_company_ids
    return [] if user.blank?

    if user.respond_to?(:active_company_members)
      return user.active_company_members.pluck(:company_id)
    end

    Array(user.respond_to?(:company_id) ? user.company_id : nil).compact
  end

  def can_manage_company_id?(company_id)
    return false if company_id.blank?
    return true if admin?

    if user.respond_to?(:active_membership_for?)
      return user.active_membership_for?(company_id)
    end

    user_company_ids.include?(company_id)
  end

  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      if user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)
        scope.all
      else
        raise NotImplementedError, "You must define #resolve in #{self.class}"
      end
    end

    private

    attr_reader :user, :scope

    def user_company_ids
      return [] if user.blank?

      if user.respond_to?(:active_company_members)
        return user.active_company_members.pluck(:company_id)
      end

      Array(user.respond_to?(:company_id) ? user.company_id : nil).compact
    end
  end
end
