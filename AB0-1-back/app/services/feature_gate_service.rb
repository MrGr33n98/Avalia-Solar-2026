# frozen_string_literal: true

class FeatureGateService
  FEATURE_ACCESS = {
    free: %w[view_dashboard basic_analytics],
    pro: %w[view_dashboard basic_analytics advanced_analytics top_campaigns reputation_tracking leads_tracking],
    enterprise: %w[view_dashboard basic_analytics advanced_analytics top_campaigns reputation_tracking leads_tracking
                   api_access webhooks white_label_support priority_support]
  }.freeze

  def self.can_access?(company, feature)
    return true if company.nil? # Fallback seguro

    plan_tier = company.plan&.tier || company.plan&.plan_tier || 'free'
    FEATURE_ACCESS[plan_tier.to_sym]&.include?(feature) || false
  end

  def self.accessible_features(company)
    return [] if company.nil?

    plan_tier = company.plan&.tier || company.plan&.plan_tier || 'free'
    FEATURE_ACCESS[plan_tier.to_sym] || []
  end
end
