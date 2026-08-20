# frozen_string_literal: true

class SocialFollowPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def create?
    owner?
  end

  def destroy?
    owner?
  end

  private

  def owner?
    user.present? && record.is_a?(SocialFollow) && record.follower_id == user.id
  end
end
