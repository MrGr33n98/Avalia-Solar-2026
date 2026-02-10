class CompanyAccessRequestPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    admin?
  end

  def approve?
    admin?
  end

  def reject?
    admin?
  end

  class Scope < Scope
    def resolve
      return scope.all if user.is_a?(AdminUser)

      scope.none
    end
  end
end
