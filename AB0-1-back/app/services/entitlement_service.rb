class EntitlementService
  def self.call(company:)
    new(company: company).call
  end

  def initialize(company:)
    @company = company
  end

  def call
    # Leverage existing CompanyFeatureAccessResolver and format for V2
    features = CompanyFeatureAccessResolver.call(company: @company)
    
    {
      'features' => features,
      'plan' => {
        'id' => @company.plan&.id,
        'name' => @company.plan&.name,
        'tier' => @company.respond_to?(:inferred_plan_tier) ? @company.inferred_plan_tier : 'free'
      }
    }
  end

  def self.get_limit(company, key)
    # Get feature limits explicitly
    definition = PlanFeatureCatalog.feature_definition(key) if defined?(PlanFeatureCatalog)
    company.feature_value_from_plan(key, include_defaults: true) if company.respond_to?(:feature_value_from_plan)
  end
end
