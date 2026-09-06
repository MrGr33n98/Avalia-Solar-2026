# frozen_string_literal: true

module Sales
  class ContactImportPolicy < ApplicationPolicy
    def index?
      user.present? && user_belongs_to_tenant?
    end

    def show?
      user_belongs_to_tenant?
    end

    def create?
      user.present? && user_belongs_to_tenant?
    end

    def mapping?
      user_belongs_to_tenant?
    end

    def commit?
      user_belongs_to_tenant?
    end

    def cancel?
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
