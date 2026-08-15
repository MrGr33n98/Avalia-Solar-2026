class ReviewerPublicationPolicy < ApplicationPolicy
  def show?
    owner?
  end

  alias_method :update?, :show?
  alias_method :publish?, :show?
  alias_method :archive?, :show?
  alias_method :destroy?, :show?

  class Scope < Scope
    def resolve
      scope.where(user: user)
    end
  end

  private

  def owner?
    record.user_id == user.id
  end
end
