# frozen_string_literal: true

class FeatureGateService
  FEATURE_ACCESS = {
    free: %w[view_dashboard basic_analytics],
    pro: %w[view_dashboard basic_analytics advanced_analytics top_campaigns reputation_tracking leads_tracking],
    enterprise: %w[view_dashboard basic_analytics advanced_analytics top_campaigns reputation_tracking leads_tracking
                   api_access webhooks white_label_support priority_support]
  }.freeze

  def self.can_access?(company, feature)
    return FEATURE_ACCESS[:free].include?(feature.to_s) if company.nil?

    plan_tier = plan_tier_for(company)
    FEATURE_ACCESS[plan_tier.to_sym]&.include?(feature.to_s) || false
  end

  def self.accessible_features(company)
    return [] if company.nil?

    plan_tier = plan_tier_for(company)
    FEATURE_ACCESS[plan_tier.to_sym] || []
  end

  def self.plan_tier_for(company)
    plan = company&.plan
    return company.inferred_plan_tier if company.respond_to?(:inferred_plan_tier)
    return 'free' unless plan
    return plan.inferred_plan_tier if plan.respond_to?(:inferred_plan_tier)
    return plan.plan_tier if plan.respond_to?(:plan_tier)
    return plan.tier if plan.respond_to?(:tier)

    'free'
  end
end
