# frozen_string_literal: true

class ChatSessionPolicy < ApplicationPolicy
  def show?
    user.admin? || (record.company_id.present? && (record.company_id == user.company_id || user.active_membership_for?(record.company_id)))
  end

  def create?
    true
  end

  def update?
    user.admin? || (record.company_id.present? && (record.company_id == user.company_id || user.active_membership_for?(record.company_id)))
  end

  def destroy?
    user.admin? || (record.company_id.present? && (record.company_id == user.company_id || user.active_membership_for?(record.company_id)))
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      else
        company_ids = user.active_member_companies.select(:id)
        company_ids = [user.company_id] if company_ids.blank? && user.company_id.present?
        scope.where(company_id: company_ids)
      end
    end
  end
end

