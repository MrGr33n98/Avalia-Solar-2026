class Plan < ApplicationRecord
  attr_accessor :plan_tier_template

  before_validation :normalize_feature_payloads

  validate :validate_feature_configuration

  def feature_flags
    PlanFeatureCatalog.normalize(raw_feature_flags, plan_tier: inferred_plan_tier)
  end

  def raw_feature_flags
    json_features =
      if respond_to?(:features_json)
        parse_feature_source(features_json)
      else
        {}
      end
    return json_features if json_features.present?

    parse_feature_source(respond_to?(:features) ? features : nil)
  end

  def inferred_plan_tier
    PlanFeatureCatalog.infer_plan_tier(
      name: name,
      price: price,
      features: raw_feature_flags
    )
  end

  def enabled_feature_keys
    feature_flags.select { |_key, value| value == true }.keys
  end

  def feature_groups
    PlanFeatureCatalog.known_keys.group_by do |key|
      PlanFeatureCatalog.feature_definition(key)[:group]
    end
  end

  def setup_info
    flags = feature_flags
    return "Setup Grátis (Incluso)" if flags['setup_included']
    
    fee = flags['setup_fee'].to_i
    if fee.positive?
      "Taxa única: R$ #{fee}"
    else
      "Setup sob consulta"
    end
  end

  def onboarding_info
    feature_flags['onboarding_session'] ? "Inclui sessão de onboarding assistida" : nil
  end

  def full_implementation_summary
    [setup_info, onboarding_info].compact.join(" | ")
  end

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    attrs = %w[created_at description features id name price updated_at]
    attrs << 'features_json' if column_names.include?('features_json')
    attrs
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  private

  def normalize_feature_payloads
    tier = normalized_template_tier
    normalized = PlanFeatureCatalog.normalize(raw_feature_flags, plan_tier: tier)

    self.features_json = normalized if respond_to?(:features_json=)
    self.features = normalized.to_json if respond_to?(:features=)
  rescue StandardError
    nil
  end

  def validate_feature_configuration
    normalized = feature_flags

    if (normalized['pricing_table'] || normalized['special_offer']) && !normalized['custom_ctas']
      errors.add(:features_json, 'pricing_table e special_offer exigem custom_ctas habilitado')
    end

    if normalized['intent_scores'] && !normalized['advanced_analytics']
      errors.add(:features_json, 'intent_scores exige advanced_analytics')
    end

    if normalized['webhooks'] && !normalized['intent_scores']
      errors.add(:features_json, 'webhooks exige intent_scores')
    end
  rescue StandardError => e
    errors.add(:features_json, "invalido: #{e.message}")
  end

  def normalized_template_tier
    PlanFeatureCatalog.normalize_plan_tier(plan_tier_template.presence || inferred_plan_tier)
  end

  def parse_feature_source(raw)
    case raw
    when String
      begin
        JSON.parse(raw)
      rescue StandardError
        begin
          YAML.safe_load(raw)
        rescue StandardError
          {}
        end
      end
    when Hash
      raw
    else
      {}
    end
  rescue StandardError
    {}
  end
end
