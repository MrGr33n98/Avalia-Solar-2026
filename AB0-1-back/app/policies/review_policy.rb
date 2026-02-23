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

  def approve?
    admin?
  end

  alias_method :reject?, :approve?
  alias_method :analyze?, :approve?
  alias_method :batch_action?, :approve?

  private

  def company_reviewer?
    user.respond_to?(:review_user?) && user.review_user?
  end
end
