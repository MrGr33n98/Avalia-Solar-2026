# frozen_string_literal: true

class ChatSessionPolicy < ApplicationPolicy
  def show?
    user.admin? || record.company_id == user.company_id
  end

  def create?
    # Anybody can create a chat session on behalf of a company, provided they have the widget token
    # But for API endpoints, this is usually unprotected or governed by origin.
    true
  end

  def update?
    user.admin? || record.company_id == user.company_id
  end

  def destroy?
    user.admin? || record.company_id == user.company_id
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      else
        scope.where(company_id: user.company_id)
      end
    end
  end
end
