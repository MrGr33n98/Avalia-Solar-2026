# frozen_string_literal: true

class ReviewPolicy < ApplicationPolicy
  def index?
    user.respond_to?(:admin?) && user.admin? || (user.respond_to?(:review_user?) && user.review_user?)
  end

  def show?
    index?
  end

  def update?
    index?
  end
end
