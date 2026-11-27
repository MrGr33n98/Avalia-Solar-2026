class CompanyFeatureAccessResolver
  RUNTIME_VALUE_RESOLVERS = {
    'custom_ctas' => ->(company) { company.quote_feature_enabled? },
    'whatsapp_contact_button' => ->(company) { company.whatsapp_contact_button_entitled? },
    'featured_review' => ->(company) { company.can_use_social_proof? },
    'social_proof' => ->(company) { company.can_use_social_proof? },
    'media_upload' => ->(company) { company.media_upload_allowed? },
    'financing_simulation' => ->(company) { company.financing_feature_allowed? },
    'intent_scores' => ->(company) { company.can_view_intent_scores? },
    'webhooks' => ->(company) { company.can_use_webhooks? },
    'sector_question_limit' => ->(company) { company.sector_question_limit }
  }.freeze

  UPSELL_STATES = %w[locked hidden].freeze
  PUBLIC_PLANS_CACHE_KEY = 'company_feature_access/public_upgrade_plans/v1'.freeze

  def self.call(company:)
    new(company: company).call
  end

  def initialize(company:)
    @company = company
  end

  def call
    PlanFeatureCatalog.known_keys.each_with_object({}) do |key, memo|
      memo[key] = access_payload_for(key)
    rescue StandardError => e
      # Uma feature inconsistente nao deve derrubar todo o painel de planos.
      # Falha fechada: nunca presumir que o recurso esta habilitado.
      Rails.logger.error(
        "[CompanyFeatureAccessResolver] company_id=#{company.id} feature=#{key} " \
        "error=#{e.class}: #{e.message}"
      )
      memo[key] = {
        'state' => 'unavailable',
        'value' => nil,
        'source' => 'resolver_error',
        'reason' => 'temporarily_unavailable'
      }
    end
  end

  private

  attr_reader :company

  def access_payload_for(key)
    definition = PlanFeatureCatalog.feature_definition(key)
    value = resolved_value_for(key)
    state = PlanFeatureCatalog.access_state_for(key, value)

    payload = {
      'state' => state,
      'value' => value,
      'group' => definition[:group],
      'source' => source_for(key),
      'reason' => reason_for(definition, state, value),
      'upsell_copy' => state == 'locked' ? upsell_copy_for(key) : nil
    }.compact
    payload['unlock_plan'] = unlock_plan_for(key) if UPSELL_STATES.include?(state)
    payload
  end

  # Spec 027 (T015): menor plano público (por preço) que libera a chave, sem contar o plano atual.
  # `nil` = nenhum plano público libera → o front oferece contato comercial.
  def unlock_plan_for(key)
    plan = public_upgrade_plans.find do |candidate|
      candidate['id'] != company.plan_id &&
        PlanFeatureCatalog.access_state_for(key, candidate['features'][key]) == 'enabled'
    end
    plan&.slice('id', 'name', 'tier')
  end

  # Cache curto: `feature_access` roda por empresa nas listagens; o catálogo público muda raramente.
  def public_upgrade_plans
    @public_upgrade_plans ||= Rails.cache.fetch(PUBLIC_PLANS_CACHE_KEY, expires_in: 5.minutes) do
      Plan.where(is_public: true).order(:price, :display_order, :id).map do |plan|
        tier = plan.inferred_plan_tier
        { 'id' => plan.id, 'name' => plan.name, 'tier' => tier,
          'features' => PlanFeatureCatalog.normalize(plan.feature_flags, plan_tier: tier) }
      end
    end
  end

  def resolved_value_for(key)
    resolver = RUNTIME_VALUE_RESOLVERS[key]
    return resolver.call(company) if resolver

    company.feature_value_from_plan(key, include_defaults: true)
  end

  def source_for(key)
    explicit = company.explicit_feature_value_from_plan(key)
    return 'plan' unless explicit.nil?

    RUNTIME_VALUE_RESOLVERS.key?(key) ? 'derived' : 'catalog_default'
  end

  def reason_for(definition, state, value)
    return 'configured_off' if definition[:access_behavior] == :toggle && value == false
    return 'configured_limit' if definition[:access_behavior] == :config

    case state
    when 'enabled' then 'included_in_plan'
    when 'locked' then 'upgrade_required'
    else 'not_in_plan'
    end
  end

  def upsell_copy_for(key)
    "Disponivel mediante upgrade para #{human_label_for(key)}"
  end

  def human_label_for(key)
    key.to_s.humanize.downcase
  end
end
