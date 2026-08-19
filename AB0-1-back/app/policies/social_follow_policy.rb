# frozen_string_literal: true

class SocialFollowPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    user.present?
  end

  def destroy?
    user.present?
  end
end
