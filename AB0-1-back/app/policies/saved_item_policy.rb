# frozen_string_literal: true

class SavedItemPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def create?
    user.present?
  end

  def destroy?
    user.present?
  end
end
