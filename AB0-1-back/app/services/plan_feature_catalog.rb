# frozen_string_literal: true

# PlanFeatureCatalog: Single source of truth for feature definitions across all plans
# Defines which features exist, their access behavior, group, and tier availability
class PlanFeatureCatalog
  # Feature groups for UI organization
  GROUPS = {
    analytics: 'Analytics & Insights',
    commercial: 'Commercial Features',
    automation: 'Automation & Integration',
    social_proof: 'Social Proof & Trust',
    support: 'Support & Account'
  }.freeze

  # Access behavior determines how feature state is computed
  # :toggle     -> feature is either on/off (enabled/locked)
  # :config     -> feature has a numeric limit (enabled/locked with limits)
  # :runtime    -> feature availability depends on runtime checks
  ACCESS_BEHAVIORS = {
    toggle: :toggle,
    config: :config,
    runtime: :runtime
  }.freeze

  # Feature catalog: what features exist, their defaults, tiers, and behavior
  CATALOG = {
    # ===== Analytics & Core Features =====
    'intent_scores' => {
      group: :analytics,
      label: 'Intent Scores',
      description: 'AI-powered buyer intent scoring',
      access_behavior: :runtime,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'advanced_analytics' => {
      group: :analytics,
      label: 'Advanced Analytics',
      description: 'Extended analytics dashboard',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },

    # ===== Social Proof & Trust =====
    'social_proof' => {
      group: :social_proof,
      label: 'Social Proof & Reviews',
      description: 'Spotlight reviews and testimonials',
      access_behavior: :runtime,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'featured_review' => {
      group: :social_proof,
      label: 'Featured Review',
      description: 'Pin important reviews',
      access_behavior: :runtime,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'verified_product' => {
      group: :social_proof,
      label: 'Verified Product Badge',
      description: 'Show verification badges',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'highlight_badges' => {
      group: :social_proof,
      label: 'Highlight Badges',
      description: 'Emphasize trust badges',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },

    # ===== Commercial & Sales Features =====
    'custom_ctas' => {
      group: :commercial,
      label: 'Custom CTAs',
      description: 'Create custom calls-to-action',
      access_behavior: :runtime,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'leads_marketplace' => {
      group: :commercial,
      label: 'Leads Marketplace',
      description: 'Access qualified leads',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'financing_simulation' => {
      group: :commercial,
      label: 'Financing Simulation',
      description: 'Show financing options',
      access_behavior: :runtime,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },

    # ===== Media & Content =====
    'media_upload' => {
      group: :commercial,
      label: 'Media Upload',
      description: 'Upload images and videos',
      access_behavior: :runtime,
      tiers: { free: true, pro: true, enterprise: true },
      default: true
    },
    'media_gallery' => {
      group: :commercial,
      label: 'Media Gallery',
      description: 'Showcase media gallery',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'product_images_limit' => {
      group: :commercial,
      label: 'Product Images Limit',
      description: 'Maximum product images',
      access_behavior: :config,
      tiers: { free: 5, pro: 25, enterprise: 100 },
      default: 5
    },

    # ===== Product Information =====
    'product_description' => {
      group: :commercial,
      label: 'Product Description',
      description: 'Add product descriptions',
      access_behavior: :toggle,
      tiers: { free: true, pro: true, enterprise: true },
      default: true
    },
    'product_features_block' => {
      group: :commercial,
      label: 'Product Features Block',
      description: 'Detailed features section',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'ideal_customer_block' => {
      group: :commercial,
      label: 'Ideal Customer Block',
      description: 'Define ideal customers',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'special_offer' => {
      group: :commercial,
      label: 'Special Offer',
      description: 'Promotional offers',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'sponsored_description' => {
      group: :commercial,
      label: 'Sponsored Description',
      description: 'Premium description placement',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'downloadable_materials' => {
      group: :commercial,
      label: 'Downloadable Materials',
      description: 'Offer downloadable resources',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },

    # ===== Marketplace Features =====
    'pricing_table' => {
      group: :commercial,
      label: 'Pricing Table',
      description: 'Show pricing information',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'show_alternatives' => {
      group: :commercial,
      label: 'Show Alternatives',
      description: 'Display competitor alternatives',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'show_competitor_banners' => {
      group: :commercial,
      label: 'Competitor Banners',
      description: 'Show sponsored competitor ads',
      access_behavior: :toggle,
      tiers: { free: true, pro: false, enterprise: false },
      default: true
    },
    'promo_banner' => {
      group: :commercial,
      label: 'Promo Banner',
      description: 'Promotional banner on profile',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },

    # ===== Content & Community =====
    'company_links_block' => {
      group: :commercial,
      label: 'Company Links Block',
      description: 'Showcase company links',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'forum_highlight' => {
      group: :commercial,
      label: 'Forum Highlight',
      description: 'Highlighted forum posts',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },
    'faq_block' => {
      group: :commercial,
      label: 'FAQ Block',
      description: 'Frequently asked questions',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },

    # ===== Automation & Integration =====
    'webhooks' => {
      group: :automation,
      label: 'Webhooks',
      description: 'Incoming webhooks for real-time data',
      access_behavior: :runtime,
      tiers: { free: false, pro: false, enterprise: true },
      default: false
    },
    'api_access' => {
      group: :automation,
      label: 'API Access',
      description: 'REST API for integrations',
      access_behavior: :toggle,
      tiers: { free: false, pro: false, enterprise: true },
      default: false
    },

    # ===== Account & Support =====
    'onboarding_session' => {
      group: :support,
      label: 'Onboarding Session',
      description: 'Dedicated onboarding support',
      access_behavior: :toggle,
      tiers: { free: false, pro: true, enterprise: true },
      default: false
    },

    # ===== Quotas & Limits =====
    'sector_question_limit' => {
      group: :analytics,
      label: 'Sector Questions',
      description: 'Survey questions per sector',
      access_behavior: :config,
      tiers: { free: 2, pro: 10, enterprise: 100 },
      default: 2
    },

    # ===== Setup & Billing =====
    'setup_fee' => {
      group: :support,
      label: 'Setup Fee',
      description: 'One-time setup cost in cents',
      access_behavior: :config,
      tiers: { free: 0, pro: 0, enterprise: 0 },
      default: 0
    },
    'setup_included' => {
      group: :support,
      label: 'Setup Included',
      description: 'Setup cost included in plan',
      access_behavior: :toggle,
      tiers: { free: false, pro: false, enterprise: false },
      default: false
    },

    # ===== Enterprise Features =====
    'analytics' => {
      group: :analytics,
      label: 'Analytics',
      description: 'Enterprise analytics suite',
      access_behavior: :toggle,
      tiers: { free: false, pro: false, enterprise: true },
      default: false
    },
    'opportunities' => {
      group: :commercial,
      label: 'Opportunities',
      description: 'Business opportunities management',
      access_behavior: :toggle,
      tiers: { free: false, pro: false, enterprise: true },
      default: false
    }
  }.freeze

  class << self
    # =====================================================================
    # Discovery & Introspection
    # =====================================================================

    # Returns all known feature keys
    def known_keys
      CATALOG.keys
    end

    # Returns the full feature definition for a key
    def feature_definition(key)
      CATALOG[key.to_s] || {}
    end

    # =====================================================================
    # Feature State Computation
    # =====================================================================

    # Determines feature access state based on value
    # States: 'enabled', 'locked', 'limited'
    def access_state_for(key, value)
      definition = feature_definition(key)
      return 'unknown' if definition.blank?

      case definition[:access_behavior]
      when :toggle
        # Boolean feature: either on or off
        value == true || value == 1 || value == '1' ? 'enabled' : 'locked'
      when :config
        # Numeric/limit feature: value is the limit (0 = locked, >0 = enabled)
        numeric_value = value.to_i rescue 0
        numeric_value > 0 ? 'limited' : 'locked'
      when :runtime
        # Runtime feature: resolved by CompanyFeatureAccessResolver
        value == true || value == 1 || value == '1' ? 'enabled' : 'locked'
      else
        'unknown'
      end
    end

    # =====================================================================
    # Plan Tier Inference
    # =====================================================================

    # Infers plan tier from name, price, and features
    def infer_plan_tier(name:, price: nil, features: {})
      name_lower = name.to_s.downcase

      # Check name for hints
      return 'enterprise' if name_lower.include?('enterprise')
      return 'pro' if name_lower.include?('pro')
      return 'free' if name_lower.include?('free')

      # Check price for hints
      return 'free' if price.to_f.zero?
      return 'enterprise' if price.to_f > 3000
      return 'pro' if price.to_f > 500

      # Check features for hints
      return 'enterprise' if features&.dig('api_access') == true
      return 'pro' if features&.dig('intent_scores') == true
      return 'free' if features&.dig('social_proof') != true

      'free' # Default fallback
    end

    # =====================================================================
    # Defaults & Templates
    # =====================================================================

    # Returns default feature set for a plan tier
    def defaults_for_tier(tier)
      tier_str = tier.to_s.downcase

      known_keys.each_with_object({}) do |key, memo|
        definition = feature_definition(key)
        tier_value = definition[:tiers]&.dig(tier_str.to_sym)

        memo[key] = if definition[:access_behavior] == :config && tier_value.is_a?(Integer)
                      tier_value
                    elsif tier_value == true
                      true
                    else
                      false
                    end
      end
    end

    # =====================================================================
    # Normalization & Validation
    # =====================================================================

    # Normalizes feature values according to catalog definitions
    # Fills in missing features with defaults
    def normalize(features, plan_tier: 'free', apply_defaults: true)
      features_hash = features.is_a?(Hash) ? features : {}
      tier_str = plan_tier.to_s.downcase

      known_keys.each_with_object({}) do |key, memo|
        definition = feature_definition(key)
        explicit_value = features_hash[key]

        if explicit_value.present?
          memo[key] = explicit_value
        elsif apply_defaults
          tier_value = definition[:tiers]&.dig(tier_str.to_sym)
          memo[key] = if definition[:access_behavior] == :config && tier_value.is_a?(Integer)
                        tier_value
                      else
                        tier_value == true
                      end
        end
      end
    end

    # =====================================================================
    # Utility Methods
    # =====================================================================

    # Returns all tiers (plan types)
    def all_tiers
      %w[free pro enterprise]
    end

    # Returns the tier that has the most features (for comparison)
    def top_tier
      'enterprise'
    end

    # Checks if a feature is available in a given tier
    def available_in_tier?(feature_key, tier)
      definition = feature_definition(feature_key)
      tier_availability = definition[:tiers]&.dig(tier.to_sym)

      # For config features, check if limit is > 0
      if definition[:access_behavior] == :config
        tier_availability.to_i > 0
      else
        tier_availability == true
      end
    end

    # Returns human-readable label for a feature
    def label_for(feature_key)
      feature_definition(feature_key)[:label] || feature_key.to_s.humanize
    end

    # Returns group/category for a feature
    def group_for(feature_key)
      feature_definition(feature_key)[:group] || :other
    end
  end
end
