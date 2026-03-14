module PlanFeatureCatalog
  PLAN_TIERS = %w[free pro enterprise].freeze

  FEATURE_DEFINITIONS = {
    'product_description' => {
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'public_profile'
    },
    'product_features_block' => {
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'public_profile'
    },
    'ideal_customer_block' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'public_profile'
    },
    'promo_banner' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[banner banner_promocional]
    },
    'verified_product' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust',
      aliases: %w[verified verified_badge]
    },
    'highlight_badges' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust',
      aliases: %w[badges badges_highlight]
    },
    'custom_ctas' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[active_admin quote_feature quote_feature_enabled quote_requests quote_requests_enabled cta_whatsapp]
    },
    'pricing_table' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[pricing pricing_block plans_and_prices]
    },
    'special_offer' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[promo_offer offer]
    },
    'sponsored_description' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[sponsored_content sponsored_copy]
    },
    'downloadable_materials' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'content',
      aliases: %w[downloads materials gated_downloads]
    },
    'media_gallery' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'content',
      aliases: %w[gallery media]
    },
    'media_upload' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'content',
      aliases: %w[allow_media_uploads gallery_uploads media_uploads]
    },
    'company_links_block' => {
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'public_profile',
      aliases: %w[company_links social_links]
    },
    'forum_highlight' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust'
    },
    'featured_review' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust',
      aliases: %w[featured_reviews review_highlight]
    },
    'social_proof' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust',
      aliases: %w[social_proof_enabled]
    },
    'faq_block' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'public_profile',
      aliases: %w[faq faqs]
    },
    'show_alternatives' => {
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'marketplace_behavior'
    },
    'show_competitor_banners' => {
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'marketplace_behavior'
    },
    'advanced_analytics' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'insights',
      aliases: %w[analytics dashboard_access analytics_access]
    },
    'leads_marketplace' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :hidden,
      group: 'insights',
      aliases: %w[lead_access leads_access]
    },
    'financing_simulation' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'insights',
      aliases: %w[financing financing_tab_visible]
    },
    'webhooks' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :hidden,
      group: 'insights',
      aliases: %w[webhook webhook_access]
    },
    'intent_scores' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :hidden,
      group: 'insights',
      aliases: %w[intent_engine intent_score_access]
    },
    'sector_question_limit' => {
      type: :integer,
      default: nil,
      access_behavior: :config,
      group: 'insights',
      aliases: %w[sector_questions_limit]
    },
    'setup_fee' => {
      type: :integer,
      default: 0,
      access_behavior: :config,
      group: 'operations',
      aliases: %w[taxa_setup custo_implementacao]
    },
    'setup_included' => {
      type: :boolean,
      default: false,
      access_behavior: :toggle,
      group: 'operations'
    },
    'onboarding_session' => {
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      group: 'operations'
    }
  }.freeze

  TIER_DEFAULT_OVERRIDES = {
    'free' => {
      'setup_included' => true # Free plans usually don't have setup
    },
    'pro' => {
      'setup_fee' => 499,
      'onboarding_session' => true,
      'ideal_customer_block' => true,
      'promo_banner' => true,
      'verified_product' => true,
      'highlight_badges' => true,
      'custom_ctas' => true,
      'pricing_table' => true,
      'special_offer' => true,
      'sponsored_description' => true,
      'downloadable_materials' => true,
      'media_gallery' => true,
      'media_upload' => true,
      'featured_review' => true,
      'social_proof' => true,
      'faq_block' => true,
      'advanced_analytics' => true,
      'financing_simulation' => true,
      'sector_question_limit' => 10,
      'show_alternatives' => false,
      'show_competitor_banners' => false
    },
    'enterprise' => {
      'setup_fee' => 1499,
      'onboarding_session' => true,
      'ideal_customer_block' => true,
      'promo_banner' => true,
      'verified_product' => true,
      'highlight_badges' => true,
      'custom_ctas' => true,
      'pricing_table' => true,
      'special_offer' => true,
      'sponsored_description' => true,
      'downloadable_materials' => true,
      'media_gallery' => true,
      'media_upload' => true,
      'featured_review' => true,
      'social_proof' => true,
      'faq_block' => true,
      'advanced_analytics' => true,
      'leads_marketplace' => true,
      'financing_simulation' => true,
      'webhooks' => true,
      'intent_scores' => true,
      'sector_question_limit' => 25,
      'show_alternatives' => false,
      'show_competitor_banners' => false
    }
  }.freeze

  class << self
    def known_keys
      FEATURE_DEFINITIONS.keys
    end

    def defaults_for_tier(plan_tier = 'free')
      defaults.merge(TIER_DEFAULT_OVERRIDES.fetch(normalize_plan_tier(plan_tier), {}))
    end

    def defaults
      FEATURE_DEFINITIONS.each_with_object({}) do |(key, definition), memo|
        memo[key] = definition[:default]
      end
    end

    def normalize(features, plan_tier: 'free', apply_defaults: true)
      raw = stringify_hash(features)
      normalized =
        if apply_defaults
          defaults_for_tier(plan_tier).merge(preserve_unknown_entries(raw))
        else
          preserve_unknown_entries(raw)
        end

      FEATURE_DEFINITIONS.each do |key, definition|
        explicit = explicit_value(raw, key)
        normalized[key] = explicit.nil? ? normalized[key] : cast_value(explicit, definition)
      end

      normalized
    rescue StandardError
      apply_defaults ? defaults_for_tier(plan_tier) : {}
    end

    def explicit_value(features, key)
      raw = stringify_hash(features)
      candidates_for(key).each do |candidate|
        return raw[candidate] if raw.key?(candidate)
      end
      nil
    end

    def canonical_key_for(key)
      normalized_key = key.to_s
      return normalized_key if FEATURE_DEFINITIONS.key?(normalized_key)

      FEATURE_DEFINITIONS.each do |canonical_key, definition|
        return canonical_key if aliases_for_definition(definition).include?(normalized_key)
      end

      normalized_key
    end

    def feature_definition(key)
      FEATURE_DEFINITIONS[canonical_key_for(key)] || {}
    end

    def access_state_for(key, value)
      definition = feature_definition(key)
      behavior = definition[:access_behavior]

      return 'enabled' if %i[toggle config].include?(behavior)
      return 'enabled' if ActiveModel::Type::Boolean.new.cast(value)

      definition[:teaser] == :hidden ? 'hidden' : 'locked'
    end

    def normalize_plan_tier(plan_tier)
      candidate = plan_tier.to_s
      PLAN_TIERS.include?(candidate) ? candidate : 'free'
    end

    def infer_plan_tier(name:, price:, features: {})
      raw = stringify_hash(features)
      explicit_tier = raw['plan_tier'] || raw['tier']
      normalized_explicit_tier = normalize_plan_tier(explicit_tier)
      return normalized_explicit_tier if explicit_tier.present? && normalized_explicit_tier != 'free'
      return 'free' if explicit_tier.present? && explicit_tier.to_s == 'free'

      lower_name = name.to_s.downcase
      return 'enterprise' if lower_name.include?('enterprise')
      return 'pro' if lower_name.match?(/\b(pro|premium|pago)\b/)
      return 'free' if lower_name.match?(/\b(free|gratis|gratuito|basic|basico)\b/)

      return 'enterprise' if enterprise_capabilities?(raw)
      return 'pro' if price.to_f.positive? || paid_capabilities?(raw)

      'free'
    end

    private

    def stringify_hash(features)
      case features
      when Hash
        features.each_with_object({}) do |(key, value), memo|
          memo[key.to_s] = value
        end
      else
        {}
      end
    end

    def preserve_unknown_entries(raw)
      known_inputs = FEATURE_DEFINITIONS.each_with_object([]) do |(key, definition), memo|
        memo << key
        memo.concat(aliases_for_definition(definition))
      end

      raw.each_with_object({}) do |(key, value), memo|
        memo[key] = value unless known_inputs.include?(key)
      end
    end

    def candidates_for(key)
      definition = feature_definition(key)
      [canonical_key_for(key)] + aliases_for_definition(definition)
    end

    def aliases_for_definition(definition)
      Array(definition[:aliases]).map(&:to_s)
    end

    def cast_value(value, definition)
      case definition[:type]
      when :integer
        integer = value.to_i
        integer.positive? ? integer : nil
      else
        ActiveModel::Type::Boolean.new.cast(value)
      end
    end

    def enterprise_capabilities?(raw)
      %w[webhooks webhook webhook_access intent_scores intent_engine intent_score_access].any? do |key|
        ActiveModel::Type::Boolean.new.cast(raw[key])
      end
    end

    def paid_capabilities?(raw)
      %w[
        custom_ctas
        active_admin
        quote_feature
        social_proof
        social_proof_enabled
        advanced_analytics
        analytics
        dashboard_access
        pricing_table
        promo_banner
      ].any? do |key|
        ActiveModel::Type::Boolean.new.cast(raw[key])
      end
    end
  end
end
