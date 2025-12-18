class FinancingConfigurationPolicy < ApplicationPolicy
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

  def import_json?
    admin?
  end

  def process_import_json?
    admin?
  end

  def reset_defaults?
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
