# frozen_string_literal: true

# Commercial plan mutations are restricted to designated billing super-admins.
# Do not enforce AdminUser#billing_super_admin? here until the legacy MFA
# enrollment schema/controller are reconciled: that method would lock out
# currently authorized administrators even after this editor fix.
class PlanPolicy < ApplicationPolicy
  def create?
    commercial_admin?
  end

  def update?
    commercial_admin?
  end

  def destroy?
    commercial_admin?
  end

  private

  def commercial_admin?
    user.is_a?(AdminUser) && user.billing_role == 'super_admin'
  end
end
