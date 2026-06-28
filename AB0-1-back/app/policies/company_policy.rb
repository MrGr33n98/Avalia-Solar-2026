class CompanyPolicy < ApplicationPolicy
  def index?
    admin? || (user.respond_to?(:company_user?) && user.company_user?)
  end

  def show?
    return true if admin?

    company_user? && (owns_record? || active_membership.present?)
  end

  def feature_access?
    true
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

  def view_dashboard?
    admin? || company_member?
  end

  def view_analytics?
    admin? || company_member?
  end

  def view_premium_metrics?
    admin? || (company_member? && record.has_paid_plan?)
  end

  def view_leads?
    admin? || company_member?
  end

  def edit_company?
    admin? || company_owner?
  end

  def edit_categories?
    admin? || company_owner?
  end

  def edit_reviews?
    admin? || company_owner?
  end

  def upload_media?
    admin? || (company_owner? && record.media_upload_allowed?)
  end

  def manage_pricing?
    admin? || company_owner?
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



  def company_owner?
    user.owner_of?(record)
  end

  def company_member?
    user.active_membership_for?(record.id) || company_owner?
  end

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
