# frozen_string_literal: true

class ReactionPolicy < ApplicationPolicy
  def create?
    user.present?
  end

  def destroy?
    user.present?
  end
end
