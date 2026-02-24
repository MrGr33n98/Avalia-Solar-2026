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

  def company_scope?
    return true if admin?

    record_company_id = record.try(:company_id) || record.try(:company)&.id
    can_manage_company_id?(record_company_id)
  end
end
