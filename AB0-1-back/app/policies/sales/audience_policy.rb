module Sales
  class AudiencePolicy < ApplicationPolicy
    def index?
      admin? || user&.company_id.present?
    end

    def create?
      index?
    end

    def show?
      index? && record.company_id == user.company_id
    end

    alias update? show?
    alias destroy? show?
  end
end
