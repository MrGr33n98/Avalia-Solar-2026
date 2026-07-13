# frozen_string_literal: true

class CompanyCategoryLimitService
  FEATURE_KEY = 'company_categories_limit'
  FALLBACK_LIMITS = {
    'free' => 3,
    'essential' => 6,
    'pro' => 12,
    'enterprise' => 999
  }.freeze

  def initialize(company)
    @company = company
  end

  def limit
    configured = configured_limit
    return configured if configured&.positive?

    FALLBACK_LIMITS.fetch(plan_tier, FALLBACK_LIMITS['free'])
  end

  def snapshot(requested_category_ids: [])
    requested_ids = normalize_ids(requested_category_ids)
    current_ids = normalize_ids(@company.categories.pluck(:id))
    projected_ids = (current_ids + requested_ids).uniq
    current_limit = limit

    {
      feature_key: FEATURE_KEY,
      plan_tier: plan_tier,
      limit: current_limit,
      current_count: current_ids.size,
      requested_count: requested_ids.size,
      projected_count: projected_ids.size,
      exceeds_limit: projected_ids.size > current_limit,
      current_category_ids: current_ids,
      requested_category_ids: requested_ids,
      projected_category_ids: projected_ids
    }
  end

  private

  def configured_limit
    return unless @company.respond_to?(:feature_value_from_plan)

    value = @company.feature_value_from_plan(FEATURE_KEY, include_defaults: true)
    Integer(value)
  rescue ArgumentError, TypeError
    nil
  end

  def plan_tier
    @plan_tier ||= if @company.respond_to?(:inferred_plan_tier)
                     PlanFeatureCatalog.normalize_plan_tier(@company.inferred_plan_tier)
                   else
                     'free'
                   end
  end

  def normalize_ids(values)
    Array(values).flatten.compact.map(&:to_s).reject(&:blank?).uniq
  end
end
