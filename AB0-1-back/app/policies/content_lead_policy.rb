# frozen_string_literal: true

class ContentLeadPolicy < ApplicationPolicy
  def index? = admin? || can_manage_company_id?(record.try(:company_id))
  def show? = index?
  def export? = index?

  class Scope < Scope
    def resolve
      return scope.all if admin?

      scope.where(company_id: user_company_ids)
    end
  end
end
