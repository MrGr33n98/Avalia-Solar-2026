class BillingPolicy < ApplicationPolicy
  def show?
    admin_or_member?
  end

  def checkout?
    admin_or_member?
  end

  def portal?
    admin_or_member?
  end

  def enterprise_lead?
    admin_or_member?
  end

  private

  def admin_or_member?
    can_manage_company_id?(record.id)
  end

  def admin?
    user.respond_to?(:admin?) && user.admin?
  end

  def company_member_active?
    return false unless user.respond_to?(:company_members)

    user.company_members.exists?(
      company_id: record.id,
      status: 'active'
    )
  end

  def company_owner?
    company_member_active? &&
      user.company_members.find_by(company_id: record.id)&.role == 'owner'
  end

  def company_editor?
    company_member_active? &&
      user.company_members.find_by(company_id: record.id)&.role == 'editor'
  end
end
