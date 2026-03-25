class Plan < ApplicationRecord
  # Associations
  has_many :companies, dependent: :nullify
  has_many :subscription_plans, dependent: :destroy

  # Validations
  validates :name, presence: true, uniqueness: true
  validates :price, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Virtual attribute to store feature flags during form submission
  attr_accessor :plan_feature_fields, :plan_tier_template

  # =========================================================================
  # Feature Management
  # =========================================================================

  def feature_flags
    return features_json if features_json.present?
    
    # Fallback to legacy 'features' column if it's text/json
    if respond_to?(:features) && features.present?
      begin
        return JSON.parse(features) if features.is_a?(String)
        return features if features.is_a?(Hash)
      rescue JSON::ParserError
        {}
      end
    end
    
    {}
  end

  def enabled_feature_keys
    feature_flags.select { |_, v| PlanFeatureCatalog.access_state_for(_, v) == 'enabled' }.keys
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
      "Taxa única de #{ActionController::Base.helpers.number_to_currency(fee, unit: 'R$', separator: ',', delimiter: '.')} para ativação."
    else
      'Sem custos de implementação.'
    end
  end

  # =========================================================================
  # Admin/Ransack
  # =========================================================================

  def self.ransackable_attributes(_auth_object = nil)
    %w[id name description price created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[companies subscription_plans]
  end

  def to_s
    name
  end
end
