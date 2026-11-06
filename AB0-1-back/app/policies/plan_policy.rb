# frozen_string_literal: true

# Commercial entitlements and prices affect all companies attached to a Plan.
# Read access stays available to admins; mutations require 2FA-protected billing
# super-admin privileges instead of ApplicationPolicy's permissive fallback.
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
    user.is_a?(AdminUser) && user.billing_super_admin?
  end
end
