# frozen_string_literal: true

class ReviewPolicy < ApplicationPolicy
  def index?
    admin? || company_reviewer?
  end

  def show?
    index?
  end

  def update?
    index?
  end

  private

  def company_reviewer?
    user.respond_to?(:review_user?) && user.review_user?
  end
end
