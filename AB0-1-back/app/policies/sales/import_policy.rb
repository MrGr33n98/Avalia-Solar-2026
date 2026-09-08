# frozen_string_literal: true

module Sales
  class ImportPolicy < ApplicationPolicy
    def index?
      user.present? && user_belongs_to_tenant?
    end

    def show?
      user_belongs_to_tenant?
    end

    def create?
      user.present? && user_belongs_to_tenant?
    end

    def analyze?
      user_belongs_to_tenant?
    end

    def mapping?
      user_belongs_to_tenant?
    end

    def validate?
      user_belongs_to_tenant?
    end

    def commit?
      user_belongs_to_tenant?
    end

    def rows?
      user_belongs_to_tenant?
    end

    def errors_csv?
      user_belongs_to_tenant?
    end

    def cancel?
      user_belongs_to_tenant?
    end

    private

    def user_belongs_to_tenant?
      return true if user&.respond_to?(:admin?) && user.admin?
      return false unless user&.company_id.present?
      return true if record.is_a?(Class)

      record.respond_to?(:company_id) && user.company_id == record.company_id
    end

    class Scope < Scope
      def resolve
        return scope.all if user&.respond_to?(:admin?) && user.admin?
        return scope.where(company_id: user.company_id) if user&.company_id.present?

        scope.none
      end
    end
  end
end
