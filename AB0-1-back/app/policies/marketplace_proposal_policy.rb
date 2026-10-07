class MarketplaceProposalPolicy < ApplicationPolicy
  def index?
    buyer? || company_member? || admin?
  end

  alias show? index?
  alias compare? index?
  alias view? index?
  alias accept? index?
  alias decline? index?
  alias request_change? index?
  alias meeting? index?

  def update?
    company_member?
  end

  def send?
    company_member?
  end

  def new_version?
    company_member?
  end

  def withdraw?
    company_member?
  end

  private

  def buyer?
    return false unless user.respond_to?(:active?)
    
    user.active? && user.review_user? && user.confirmed? &&
      (record.buyer_user_id == user.id || record.lead&.email.to_s.casecmp?(user.email.to_s))
  end

  def company_member?
    admin? || (user.respond_to?(:company_user?) && user.company_user? && user.active_membership_for?(record.company_id))
  end
end
