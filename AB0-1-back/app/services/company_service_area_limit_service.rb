# frozen_string_literal: true

class CompanyServiceAreaLimitService
  STATES_FEATURE_KEY = 'service_area_states_limit'
  CITIES_FEATURE_KEY = 'service_area_cities_limit'
  NATIONAL_COVERAGE_KEY = 'national_coverage'

  FALLBACK_LIMITS = {
    'free' => { states: 1, cities: 3, national: false },
    'essential' => { states: 1, cities: 10, national: false },
    'pro' => { states: 3, cities: 30, national: false },
    'enterprise' => { states: 999, cities: 999, national: true }
  }.freeze

  def initialize(company)
    @company = company
  end

  def snapshot(attributes: {})
    requested_states = normalize_states(attribute_value(attributes, 'coverage_state_codes', 'coverage_states') || current_states)
    requested_cities = normalize_cities(attribute_value(attributes, 'coverage_city_names', 'coverage_cities') || current_cities)
    limits = resolved_limits
    national_request = requested_states.size >= 27

    {
      feature_keys: {
        states: STATES_FEATURE_KEY,
        cities: CITIES_FEATURE_KEY,
        national: NATIONAL_COVERAGE_KEY
      },
      plan_tier: plan_tier,
      states_limit: limits[:states],
      cities_limit: limits[:cities],
      national_coverage_allowed: limits[:national],
      current_states_count: current_states.size,
      current_cities_count: current_cities.size,
      projected_states_count: requested_states.size,
      projected_cities_count: requested_cities.size,
      exceeds_states_limit: requested_states.size > limits[:states],
      exceeds_cities_limit: requested_cities.size > limits[:cities],
      national_coverage_requested: national_request,
      exceeds_national_coverage: national_request && !limits[:national],
      current_states: current_states,
      current_cities: current_cities,
      projected_states: requested_states,
      projected_cities: requested_cities
    }.tap do |payload|
      payload[:exceeds_limit] = payload[:exceeds_states_limit] ||
                                payload[:exceeds_cities_limit] ||
                                payload[:exceeds_national_coverage]
    end
  end

  private

  def attribute_value(attributes, *keys)
    keys.each do |key|
      return attributes[key] if attributes.key?(key)

      symbol_key = key.to_sym
      return attributes[symbol_key] if attributes.key?(symbol_key)
    end

    nil
  end

  def resolved_limits
    fallback = FALLBACK_LIMITS.fetch(plan_tier, FALLBACK_LIMITS['free'])
    {
      states: configured_integer(STATES_FEATURE_KEY) || fallback[:states],
      cities: configured_integer(CITIES_FEATURE_KEY) || fallback[:cities],
      national: configured_boolean(NATIONAL_COVERAGE_KEY, fallback[:national])
    }
  end

  def configured_integer(key)
    return unless @company.respond_to?(:feature_value_from_plan)

    value = @company.feature_value_from_plan(key, include_defaults: true)
    parsed = Integer(value)
    parsed.positive? ? parsed : nil
  rescue ArgumentError, TypeError
    nil
  end

  def configured_boolean(key, fallback)
    return fallback unless @company.respond_to?(:feature_enabled_from_plan?)

    @company.feature_enabled_from_plan?(key, include_defaults: true)
  rescue StandardError
    fallback
  end

  def current_states
    @current_states ||= normalize_states(@company.respond_to?(:coverage_state_list) ? @company.coverage_state_list : @company.coverage_states)
  end

  def current_cities
    @current_cities ||= normalize_cities(@company.respond_to?(:coverage_city_list) ? @company.coverage_city_list : @company.coverage_cities)
  end

  def plan_tier
    @plan_tier ||= if @company.respond_to?(:inferred_plan_tier)
                     PlanFeatureCatalog.normalize_plan_tier(@company.inferred_plan_tier)
                   else
                     'free'
                   end
  end

  def normalize_states(values)
    Array(values).flatten.compact.flat_map { |value| value.to_s.split(',') }
                 .map { |value| Locations::CoverageNormalizer.normalize_state(value) }
                 .compact_blank.uniq
  end

  def normalize_cities(values)
    Locations::CoverageNormalizer.normalize_cities(values)
  rescue StandardError
    Array(values).flatten.compact.flat_map { |value| value.to_s.split(',') }
                 .map { |value| value.to_s.strip }
                 .compact_blank.uniq
  end
end
