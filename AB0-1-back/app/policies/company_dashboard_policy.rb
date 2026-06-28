# frozen_string_literal: true

class CompanyDashboardPolicy < ApplicationPolicy
  def show?
    admin_or_member?
  end

  def view_analytics?
    admin_or_member?
  end

  def view_analytics_timeseries?
    admin_or_member? && (admin? || company_has_paid_plan?)
  end

  def view_analytics_reputation?
    admin_or_member?
  end

  def view_analytics_ranking?
    admin_or_member?
  end

  def view_analytics_campaigns?
    admin_or_member?
  end

  def view_trust_health?
    admin_or_member?
  end

  def view_intent_summary?
    admin_or_member?
  end

  def view_certification_progress?
    admin_or_member?
  end

  def view_assets?
    admin_or_member?
  end

  def view_stats?
    admin_or_member?
  end

  def view_banner_subscriptions?
    admin_or_member?
  end

  def update_info?
    admin? || company_owner?
  end

  def add_categories?
    admin? || company_owner?
  end

  def remove_category?
    admin? || company_owner?
  end

  def update_ctas?
    admin? || company_owner?
  end

  def update_logo?
    admin? || company_owner?
  end

  def update_banner?
    admin? || company_owner?
  end

  def upload_media?
    admin? || company_owner?
  end

  def add_video?
    admin? || company_owner?
  end

  def remove_video?
    admin? || company_owner?
  end

  def view_pending_changes?
    admin? || company_owner?
  end

  def view_notifications?
    admin_or_member?
  end

  def view_media?
    admin_or_member?
  end

  def view_videos?
    admin_or_member?
  end

  def view_social_proof_reviews?
    admin_or_member?
  end

  def update_social_proof_review?
    admin? || company_owner?
  end

  def view_social_proof_stats?
    admin_or_member?
  end

  private

  def admin_or_member?
    admin? || company_member_active?
  end

  def admin?
    user.respond_to?(:admin?) && user.admin?
  end

  def company_member_active?
    return false unless user.respond_to?(:company_members)

    user.company_members.exists?(
      company_id: record.id,
      status: 'active'
    )
  end

  def company_owner?
    company_member_active? &&
      user.company_members.find_by(company_id: record.id)&.role == 'owner'
  end

  def company_has_paid_plan?
    record.respond_to?(:has_paid_plan?) && record.has_paid_plan?
  end
end
