class CompanyFaqPolicy < ApplicationPolicy
  def index?
    admin? || company_scope?
  end

  def show?
    index?
  end

  def create?
    index?
  end

  def update?
    index?
  end

  def destroy?
    index?
  end

  def reorder?
    index?
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

  def company_scope?
    return true if admin?
    return false unless user.respond_to?(:company_user?) && user.company_user?

    record_company_id = record.try(:company_id) || record.try(:company)&.id
    record_company_id.present? && record_company_id == user.company_id
  end
end
