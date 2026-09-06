# frozen_string_literal: true

module Sales
  class ContactListPolicy < ApplicationPolicy
    def index?
      user.present?
    end

    def show?
      user_belongs_to_tenant?
    end

    def create?
      user.present?
    end

    def update?
      user_belongs_to_tenant?
    end

    def destroy?
      user.admin? || user_belongs_to_tenant?
    end

    def add_contacts?
      user_belongs_to_tenant?
    end

    def remove_contacts?
      user_belongs_to_tenant?
    end

    private

    def user_belongs_to_tenant?
      return true if user&.admin?
      return false unless user&.company_id.present? && record.respond_to?(:company_id)

      user.company_id == record.company_id
    end

    class Scope < Scope
      def resolve
        return scope.all if user&.admin?
        return scope.where(company_id: user.company_id) if user&.company_id.present?

        scope.none
      end
    end
  end
end
