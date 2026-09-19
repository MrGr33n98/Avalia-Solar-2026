# frozen_string_literal: true

class EntitlementService
  class NotEntitledError < StandardError; end
  class QuotaExceededError < StandardError; end

  class << self
    def call(company:)
      new(company: company).call
    end

    def entitled?(company:, feature:)
      new(company: company).entitled?(feature)
    end

    def limit(company:, feature:)
      new(company: company).limit(feature)
    end

    def usage(company:, feature:)
      new(company: company).usage(feature)
    end

    def remaining(company:, feature:)
      new(company: company).remaining(feature)
    end

    def explain(company:, feature:, target: nil)
      new(company: company).explain(feature, target: target)
    end

    def enforce!(company:, feature:, target: nil)
      new(company: company).enforce!(feature, target: target)
    end

    def with_quota_lock(company:, feature:, target: nil, &block)
      new(company: company).with_quota_lock(feature, target: target, &block)
    end

    def get_limit(company, key)
      limit(company: company, feature: key)
    end
  end

  def initialize(company:)
    @company = company
  end

  def call
    features = CompanyFeatureAccessResolver.call(company: @company)
    plan_tier = @company.respond_to?(:inferred_plan_tier) ? @company.inferred_plan_tier : 'free'

    {
      'features' => features,
      'plan' => {
        'id' => @company.plan&.id,
        'name' => @company.plan&.name,
        'tier' => plan_tier
      }
    }
  end

  def entitled?(feature)
    feature_key = normalize_key(feature)
    resolved = feature_payload(feature_key)
    return false if resolved.blank?

    state = resolved['state']
    val = resolved['value']

    # For metered/quota features, if value is a number, entitlement requires limit > 0
    return val.positive? if val.is_a?(Numeric)

    state == 'enabled'
  end

  def limit(feature)
    feature_key = normalize_key(feature)
    resolved = feature_payload(feature_key)
    return nil if resolved.blank?

    val = resolved['value']
    val.is_a?(Numeric) ? val.to_i : nil
  end

  def usage(feature, target: nil)
    feature_key = normalize_key(feature)

    case feature_key
    when 'featured_products', 'products_showcase'
      if @company.class.respond_to?(:reflect_on_association) && @company.class.reflect_on_association(:catalog_products)
        @company.catalog_products.where(status: 'active', featured: true).count
      elsif @company.class.respond_to?(:reflect_on_association) && @company.class.reflect_on_association(:products)
        @company.products.where(featured: true).count
      else
        0
      end
    when 'company_categories_limit', 'categories_limit'
      if @company.class.respond_to?(:reflect_on_association) && @company.class.reflect_on_association(:company_categories)
        @company.company_categories.count
      elsif @company.class.respond_to?(:reflect_on_association) && @company.class.reflect_on_association(:categories)
        @company.categories.count
      else
        0
      end
    when 'service_area_cities_limit', 'cities_coverage_limit'
      if @company.class.respond_to?(:reflect_on_association) && @company.class.reflect_on_association(:service_areas)
        @company.service_areas.count
      elsif @company.respond_to?(:coverage_city_list)
        @company.coverage_city_list.size
      elsif @company.respond_to?(:coverage_cities) && @company.coverage_cities.present?
        @company.coverage_cities.is_a?(Array) ? @company.coverage_cities.size : @company.coverage_cities.to_s.split(',').map(&:strip).reject(&:blank?).size
      else
        0
      end
    when 'service_area_states_limit', 'states_coverage_limit'
      if @company.class.respond_to?(:reflect_on_association) && @company.class.reflect_on_association(:service_areas)
        @company.service_areas.distinct.count(:state)
      elsif @company.respond_to?(:coverage_state_list)
        @company.coverage_state_list.size
      elsif @company.respond_to?(:coverage_states) && @company.coverage_states.present?
        @company.coverage_states.is_a?(Array) ? @company.coverage_states.size : @company.coverage_states.to_s.split(',').map(&:strip).reject(&:blank?).size
      else
        0
      end
    when 'product_images_limit'
      if target.respond_to?(:images)
        target.images.respond_to?(:attachments) ? target.images.attachments.count : target.images.count
      else
        0
      end
    else
      0
    end
  end

  def remaining(feature, target: nil)
    lim = limit(feature)
    return nil if lim.nil? && entitled?(feature)
    return 0 if lim.nil? && !entitled?(feature)

    used = target.present? ? usage(feature, target: target) : usage(feature)
    [lim - used, 0].max
  end

  def explain(feature, target: nil)
    feature_key = normalize_key(feature)
    resolved = feature_payload(feature_key)
    is_allowed = entitled?(feature_key)
    lim = limit(feature_key)
    used = target.present? ? usage(feature_key, target: target) : usage(feature_key)
    rem = target.present? ? remaining(feature_key, target: target) : remaining(feature_key)
    plan_tier = @company.respond_to?(:inferred_plan_tier) ? @company.inferred_plan_tier : 'free'

    {
      feature: feature_key,
      allowed: is_allowed,
      source: resolved['source'] || 'catalog_default',
      plan: plan_tier,
      limit: lim,
      usage: used,
      remaining: rem,
      reason: resolved['reason'] || (is_allowed ? 'included_in_plan' : 'upgrade_required')
    }
  end

  def enforce!(feature, target: nil)
    explanation = explain(feature, target: target)
    unless explanation[:allowed]
      raise NotEntitledError, "Company #{@company.id} is not entitled to feature #{feature}"
    end

    if explanation[:limit].present? && explanation[:remaining].present? && explanation[:remaining] <= 0
      raise QuotaExceededError, "Company #{@company.id} exceeded quota for feature #{feature} (limit: #{explanation[:limit]}, usage: #{explanation[:usage]})"
    end

    true
  end

  def with_quota_lock(feature, target: nil, &block)
    feature_key = normalize_key(feature)
    lock_target = if feature_key == 'product_images_limit' && target.present?
                    target
                  else
                    @company
                  end

    lock_target.with_lock do
      ActiveRecord::Base.uncached do
        enforce!(feature_key, target: target)
        yield if block_given?
      end
    end
  end

  private

  def normalize_key(key)
    k = key.to_s
    if defined?(PlanFeatureCatalog)
      PlanFeatureCatalog.canonical_key_for(k) || k
    else
      k
    end
  end

  def feature_payload(key)
    features = @company.feature_access rescue {}
    features[key] || {}
  end
end
