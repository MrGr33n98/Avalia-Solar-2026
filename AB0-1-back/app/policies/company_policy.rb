class CompanyPolicy < ApplicationPolicy
  def index?
    admin? || (user.respond_to?(:company_user?) && user.company_user?)
  end

  def show?
    return true if admin?

    company_user? && (owns_record? || active_membership.present?)
  end

  def update?
    return true if admin?
    return false unless company_user?

    return true if owns_record?

    membership = active_membership
    return false unless membership

    membership.role.in?(%w[owner manager editor])
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

  def approve?
    admin?
  end

  def reject?
    admin?
  end

  def suspend?
    admin?
  end

  class Scope < Scope
    def resolve
      if user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)
        scope.all
      elsif user.respond_to?(:company_user?) && user.company_user?
        company_ids = [user.company_id]
        company_ids.concat(user.active_company_members.pluck(:company_id)) if user.respond_to?(:active_company_members)
        scope.where(id: company_ids.compact.uniq)
      else
        scope.none
      end
    end
  end

  private

  def company_user?
    user.respond_to?(:company_user?) && user.company_user?
  end

  def owns_record?
    user.respond_to?(:company_id) && user.company_id.present? && record.id == user.company_id
  end

  def active_membership
    return nil unless user.respond_to?(:company_members)

    user.company_members.find_by(company_id: record.id, status: 'active')
  end
end
