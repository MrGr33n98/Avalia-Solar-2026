class CompanyFinancingProfilePolicy < ApplicationPolicy
  def show?
    allowed?
  end

  def create?
    allowed?
  end

  def update?
    allowed?
  end

  def destroy?
    admin?
  end

  class Scope < Scope
    def resolve
      if admin?
        scope.all
      elsif user_company_ids.any?
        scope.where(company_id: user_company_ids)
      else
        scope.none
      end
    end

    private

    def admin?
      user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)
    end
  end

  private

  def allowed?
    return true if admin?

    can_manage_company_id?(record_company_id)
  end

  def record_company_id
    record.try(:company_id) || record.try(:company)&.id
  end
end
