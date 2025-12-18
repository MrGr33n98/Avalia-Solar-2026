class CompanyPolicy < ApplicationPolicy
  def index?
    admin? || (user.respond_to?(:company_user?) && user.company_user?)
  end

  def show?
    admin? || (user.respond_to?(:company_user?) && user.company_user? && record.id == user.company_id)
  end

  def update?
    admin? || (user.respond_to?(:company_user?) && user.company_user? && record.id == user.company_id)
  end

  def edit?
    update?
  end

  def create?
    admin?
  end

  def destroy?
    admin?
  end

  class Scope < Scope
    def resolve
      if user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)
        scope.all
      elsif user.respond_to?(:company_user?) && user.company_user?
        scope.where(id: user.company_id)
      else
        scope.none
      end
    end
  end
end
