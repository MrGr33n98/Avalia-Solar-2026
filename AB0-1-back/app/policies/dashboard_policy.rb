# frozen_string_literal: true

class DashboardPolicy < ApplicationPolicy
  def stats?
    admin_or_review?
  end

  def charts?
    admin_or_review?
  end

  def activity?
    admin_or_review?
  end

  def export?
    admin_or_review? || company_owner?
  end

  private

  def admin_or_review?
    (user.respond_to?(:admin?) && user.admin?) || (user.respond_to?(:review_user?) && user.review_user?)
  end

  def company_owner?
    user.respond_to?(:company_user?) && user.company_user? && record.respond_to?(:id) && user.company_id == record.id
  end
end
