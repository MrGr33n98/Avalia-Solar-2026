# frozen_string_literal: true

class CompanyMaterialPolicy < ApplicationPolicy
  def index? = admin? || can_manage_company_id?(record.try(:company_id))
  def show? = index? || record.status == 'published'
  def create? = index?
  def update? = index?
  def destroy? = index?
  def approve? = admin?
  def reject? = admin?
  def request_changes? = admin?
  def submit? = update?
  def restore? = update?

  class Scope < Scope
    def resolve
      return scope.all if user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)

      scope.where(company_id: user_company_ids)
    end
  end
end
