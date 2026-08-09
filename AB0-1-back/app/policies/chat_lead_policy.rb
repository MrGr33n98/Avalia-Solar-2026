# frozen_string_literal: true

class ChatLeadPolicy < ApplicationPolicy
  def show?
    user.admin? || record.chat_session.company_id == user.company_id
  end

  def update?
    user.admin? || record.chat_session.company_id == user.company_id
  end

  def destroy?
    user.admin? || record.chat_session.company_id == user.company_id
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      else
        scope.joins(:chat_session).where(chat_sessions: { company_id: user.company_id })
      end
    end
  end
end
