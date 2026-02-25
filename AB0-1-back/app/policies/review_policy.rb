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

  alias reject? approve?
  alias analyze? approve?
  alias batch_action? approve?

  private

  def company_reviewer?
    user.respond_to?(:review_user?) && user.review_user?
  end
end
