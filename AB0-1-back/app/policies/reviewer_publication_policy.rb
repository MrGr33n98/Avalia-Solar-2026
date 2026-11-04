class ReviewerPublicationPolicy < ApplicationPolicy
  def show?
    user.is_a?(AdminUser) || owner?
  end

  alias_method :update?, :show?
  alias_method :publish?, :show?
  alias_method :archive?, :show?
  alias_method :destroy?, :show?

  class Scope < Scope
    def resolve
      return scope.all if user.is_a?(AdminUser)

      scope.where(user: user)
    end
  end

  private

  def owner?
    user.present? && record.user_id == user.id
  end
end
