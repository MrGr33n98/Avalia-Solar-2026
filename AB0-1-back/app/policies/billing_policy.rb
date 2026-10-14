class BillingPolicy < ApplicationPolicy
  def show?
    admin? || company_owner?
  end

  def checkout?
    admin? || company_owner?
  end

  def portal?
    admin? || company_owner?
  end

  def enterprise_lead?
    admin? || company_owner?
  end

  private

  def admin_or_member?
    admin? || company_owner?
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
      user.company_members.find_by(company_id: record.id, status: 'active')&.role == 'owner'
  end

  def company_editor?
    company_member_active? &&
      user.company_members.find_by(company_id: record.id, status: 'active')&.role == 'editor'
  end
end
