# frozen_string_literal: true

module Sales
  class OpportunityPolicy < ApplicationPolicy
    def index?
      ::Sales::AuthorizationService.can?(user: user, resource: 'opportunities', action: 'read')
    end

    def show?
      index?
    end

    def summary?
      index?
    end

    def create?
      ::Sales::AuthorizationService.can?(user: user, resource: 'opportunities', action: 'manage')
    end

    def update?
      create?
    end

    def destroy?
      create?
    end

    class Scope < Scope
      def resolve
        if ::Sales::AuthorizationService.can?(user: user, resource: 'opportunities', action: 'read')
          scope.all
        else
          scope.none
        end
      end
    end
  end
end
