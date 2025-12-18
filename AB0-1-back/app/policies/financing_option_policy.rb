class FinancingOptionPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    admin?
  end

  def create?
    admin?
  end

  def update?
    admin?
  end

  def destroy?
    admin?
  end

  class Scope < Scope
    def resolve
      if user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)
        scope.all
      else
        scope.none
      end
    end
  end
end
