class Plan < ApplicationRecord
  # Associations
  has_many :companies, dependent: :nullify
  has_many :plan_configuration_audits, dependent: :nullify
  has_many :subscription_plans, dependent: :destroy
  has_many :billing_company_subscriptions, class_name: 'Billing::CompanySubscription', dependent: :destroy

  # Validations
  validates :name, presence: true, uniqueness: true
  validates :price, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Virtual attributes to store feature flags, tier, and status during form submission or specs
  attr_accessor :plan_feature_fields, :plan_tier_template, :change_reason, :status

  def tier=(val)
    self.plan_tier_template = val
  end

  def tier
    plan_tier_template || inferred_plan_tier
  end

  # =========================================================================
  # Feature Management
  # =========================================================================

  before_validation :normalize_feature_fields
  validate :validate_feature_dependencies
  validate :validate_feature_limits
  validate :validate_stripe_price_ids, if: :stripe_price_ids_changed?

  def normalize_feature_fields
    return if plan_feature_fields.nil? && plan_tier_template.blank?

    tier = plan_tier_template.presence || inferred_plan_tier || 'free'
    existing = raw_feature_flags
    # An edit without explicit feature fields must not reset custom plan values.
    submitted = plan_feature_fields.nil? ? {} : feature_field_hash(plan_feature_fields)
    unknown = submitted.keys - PlanFeatureCatalog.known_keys
    if unknown.any?
      errors.add(:features_json, "contém campos desconhecidos: #{unknown.join(', ')}")
      return
    end

    unless submitted.all? { |key, value| valid_feature_input?(key, value) }
      errors.add(:features_json, 'contém limites inválidos; use somente inteiros não negativos')
      return
    end

    source = existing.merge(submitted)
    normalized = PlanFeatureCatalog.normalize(source, plan_tier: tier)
    # Blank numeric inputs intentionally clear optional limits instead of
    # silently restoring the tier default.
    submitted.each do |key, value|
      if value == '' && PlanFeatureCatalog.feature_definition(key)[:type] == :integer
        normalized[key] = nil
      end
    end
    self.features_json = normalized if respond_to?(:features_json=)
    self.features = normalized.to_json if self.class.column_names.include?('features')
  rescue StandardError => e
    Rails.logger.error("[PlanModel] Feature normalization failed: #{e.class}: #{e.message}")
    errors.add(:features_json, 'não pôde ser processado; nenhuma alteração foi aplicada')
  end

  def feature_flags
    raw_feature_flags
  end

  def raw_feature_flags
    if respond_to?(:features_json)
      parsed_features_json = parse_feature_payload(features_json)
      return parsed_features_json if parsed_features_json.present?
    end

    parse_feature_payload(features)
  end

  def enabled_feature_keys
    feature_flags.select { |key, value| PlanFeatureCatalog.enabled_boolean_feature?(key, value) }.keys
  end

  def inferred_plan_tier
    PlanFeatureCatalog.infer_plan_tier(
      name: name,
      price: price,
      features: feature_flags
    )
  end

  def plan_tier
    inferred_plan_tier
  end

  # =========================================================================
  # UI Helpers
  # =========================================================================

  def setup_info
    value = feature_flags['setup_fee']
    return 'Setup incluso' if ActiveModel::Type::Boolean.new.cast(feature_flags['setup_included'])
    return 'Sem taxa' if value.to_i.zero?

    ActionController::Base.helpers.number_to_currency(value, unit: 'R$', separator: ',', delimiter: '.')
  end

  def full_implementation_summary
    is_included = ActiveModel::Type::Boolean.new.cast(feature_flags['setup_included'])
    fee = feature_flags['setup_fee'].to_i

    if is_included
      'Implementação completa inclusa (sem custo inicial)'
    elsif fee.positive?
      "Taxa única de #{ActionController::Base.helpers.number_to_currency(fee, unit: 'R$', separator: ',',
                                                                              delimiter: '.')} para ativação."
    else
      'Sem custos de implementação.'
    end
  end

  # =========================================================================
  # Admin/Ransack
  # =========================================================================

  def self.ransackable_attributes(_auth_object = nil)
    %w[id name description price created_at updated_at stripe_product_id stripe_price_id_monthly stripe_price_id_yearly
       is_public display_order]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[companies subscription_plans]
  end

  def to_s
    name
  end

  private

  def feature_field_hash(fields)
    raw = fields.respond_to?(:to_unsafe_h) ? fields.to_unsafe_h : fields.to_h
    raw.stringify_keys
  end

  def valid_feature_input?(key, value)
    definition = PlanFeatureCatalog.feature_definition(key)
    return true unless definition[:type] == :integer
    return true if value.nil? || value == ''

    value.to_s.match?(/\A\d+\z/)
  end

  def validate_feature_limits
    PlanFeatureCatalog.known_keys.each do |key|
      next unless PlanFeatureCatalog.feature_definition(key)[:type] == :integer

      value = PlanFeatureCatalog.explicit_value(raw_feature_flags, key)
      next if value.nil?

      unless value.is_a?(Integer) && value >= 0
        errors.add(:features_json, "#{key} deve ser inteiro não negativo")
      end
      if key == 'brand_hero_slides_limit' && value.is_a?(Integer) && value > 3
        errors.add(:features_json, 'brand_hero_slides_limit deve estar entre 0 e 3')
      end
    end
  end

  # Spec 027 (T010): o mesmo Price em dois períodos ou dois planos deixa o checkout cobrando o valor errado
  # e a resolução de assinatura (`Billing::SubscriptionSyncService`) ambígua.
  def stripe_price_ids_changed?
    will_save_change_to_stripe_price_id_monthly? || will_save_change_to_stripe_price_id_yearly?
  end

  def validate_stripe_price_ids
    six_months = stripe_price_id_monthly.presence
    twelve_months = stripe_price_id_yearly.presence
    if six_months && six_months == twelve_months
      errors.add(:stripe_price_id_yearly, 'deve ser diferente do Price de 6 meses')
    end

    { stripe_price_id_monthly: six_months, stripe_price_id_yearly: twelve_months }.each do |field, price_id|
      next if price_id.nil?

      errors.add(field, 'já está em uso por outro plano') if stripe_price_id_taken_by_other_plan?(price_id)
    end
  end

  def stripe_price_id_taken_by_other_plan?(price_id)
    others = Plan.where.not(id: id)
    others.where(stripe_price_id_monthly: price_id).or(others.where(stripe_price_id_yearly: price_id)).exists?
  end

  def validate_feature_dependencies
    flags = raw_feature_flags
    active = ->(key) { ActiveModel::Type::Boolean.new.cast(flags[key]) == true }
    if (active.call('pricing_table') || active.call('special_offer')) && !active.call('custom_ctas')
      errors.add(:features_json, 'pricing_table e special_offer exigem custom_ctas habilitado')
    end
    if active.call('intent_scores') && !active.call('advanced_analytics')
      errors.add(:features_json, 'intent_scores exige advanced_analytics')
    end
    if active.call('webhooks') && !active.call('intent_scores')
      errors.add(:features_json, 'webhooks exige intent_scores')
    end
  end

  def parse_feature_payload(payload)
    return {} if payload.blank?
    return payload.stringify_keys if payload.is_a?(Hash)

    JSON.parse(payload) if payload.is_a?(String)
  rescue JSON::ParserError, TypeError
    {}
  end
end
