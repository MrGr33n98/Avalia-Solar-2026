class CompanyFinancingPartnerPolicy < ApplicationPolicy
  def index?
    allowed?
  end

  def create?
    allowed?
  end

  def update?
    allowed?
  end

  def destroy?
    allowed?
  end

  def reorder?
    allowed?
  end

  class Scope < Scope
    def resolve
      if admin?
        scope.all
      elsif user.respond_to?(:company_user?) && user.company_user?
        scope.where(company_id: user.company_id)
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
    user.respond_to?(:company_user?) && user.company_user? && record_company_id == user.company_id
  end

  def record_company_id
    record.try(:company_id) || record.try(:company)&.id
  end
end
