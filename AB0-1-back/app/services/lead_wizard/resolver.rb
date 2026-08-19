# frozen_string_literal: true

module LeadWizard
  class Resolver
    DEFAULT_TEMPLATE_KEY = 'solar'
    DEFAULT_TEMPLATE_VERSION = 1
    DEFAULT_THANK_YOU_CONFIG = {}
    DEFAULT_SCHEMA = {
      steps: [
        {
          id: 'contact_info',
          title: 'Seus Dados',
          fields: [
            { key: 'full_name', target: 'lead', type: 'text', label: 'Nome Completo', required: true },
            { key: 'email', target: 'lead', type: 'email', label: 'E-mail', required: true },
            { key: 'phone', target: 'lead', type: 'tel', label: 'WhatsApp', required: true },
            { key: 'zipcode', target: 'lead', type: 'zipcode', label: 'CEP', required: true },
            { key: 'consent', target: 'lead', type: 'checkbox', label: 'Aceito os termos de uso e política de privacidade', required: true }
          ]
        },
        {
          id: 'project_details',
          title: 'Projeto',
          fields: [
            { key: 'project_profile', target: 'lead', type: 'select', label: 'Perfil do Projeto', required: true, options: [
              { label: 'Residencial', value: 'residential' },
              { label: 'Comercial', value: 'commercial' },
              { label: 'Industrial', value: 'industrial' },
              { label: 'Rural', value: 'rural' }
            ]},
            { key: 'system_size_band', target: 'lead', type: 'select', label: 'Tamanho do Sistema', required: true, options: [
              { label: 'Até 7 kWp', value: 'up_to_7_kwp' },
              { label: '8 kWp ou mais', value: '8_kwp_plus' },
              { label: 'Não sei', value: 'dont_know' }
            ]},
            { key: 'decision_timeline', target: 'lead', type: 'select', label: 'Prazo de Decisão', required: true, options: [
              { label: 'Imediato', value: 'immediate' },
              { label: 'Em 3 meses', value: '3_months' },
              { label: 'Em 6 meses', value: '6_months' },
              { label: 'Apenas pesquisando', value: 'researching' }
            ]}
          ]
        }
      ],
      ui_config: {
        show_progress_bar: true
      }
    }.freeze

    def self.resolve(category_id:, preferred_company_id: nil)
      new(category_id: category_id, preferred_company_id: preferred_company_id).resolve
    end

    def initialize(category_id:, preferred_company_id: nil)
      @category_id = category_id
      @preferred_company_id = preferred_company_id
    end

    def resolve
      availability = resolve_availability
      version = resolve_version(availability)

      payload =
        if version.is_a?(LeadWizardVersion)
          compile_version_payload(version, availability:)
        elsif version.is_a?(CategoryLeadWizard)
          compile_legacy_payload(version, availability:)
        else
          compile_default_payload(availability:)
        end

      payload.merge(category_id: @category_id, availability: availability)
    end

    private

    def resolve_version(availability)
      if @preferred_company_id.present? && availability[:company_available]
        company_version = LeadWizardVersion.published
                                           .for_company(@preferred_company_id)
                                           .latest_first
                                           .first
        return company_version if company_version.present?
      end

      category_version = LeadWizardVersion.published
                                          .for_category(@category_id)
                                          .latest_first
                                          .first
      return category_version if category_version.present?

      global_version = LeadWizardVersion.published.global_scope.latest_first.first
      return global_version if global_version.present?

      legacy = CategoryLeadWizard.find_by(category_id: @category_id, enabled: true)
      return legacy if legacy&.schema.present?

      nil
    end

    def compile_version_payload(version, availability:)
      {
        source: version.company_id.present? ? 'company_custom' : (version.category_id.present? ? 'category' : 'default'),
        template_key: version.template_key,
        template_version: version.template_version,
        schema: version.compiled_schema,
        thank_you_config: version.compiled_thank_you_config
      }.merge(availability: availability, wizard_version: version)
    end

    def compile_legacy_payload(config, availability:)
      schema = normalize_object(config.schema)
      schema[:steps] = Array(schema[:steps]).each_with_index.map do |step, index|
        compile_legacy_step(step, index)
      end.compact
      schema[:ui_config] = normalize_object(schema[:ui_config]).presence || { show_progress_bar: true }

      {
        source: 'category',
        template_key: config.template_key,
        template_version: config.template_version,
        schema: schema,
        thank_you_config: normalize_object(config.thank_you_config).presence || DEFAULT_THANK_YOU_CONFIG
      }.merge(availability: availability)
    end

    def compile_default_payload(availability:)
      {
        source: 'default',
        template_key: DEFAULT_TEMPLATE_KEY,
        template_version: DEFAULT_TEMPLATE_VERSION,
        schema: DEFAULT_SCHEMA,
        thank_you_config: DEFAULT_THANK_YOU_CONFIG
      }.merge(availability: availability)
    end

    def compile_legacy_step(step, index)
      step = normalize_object(step)
      fields = Array(step[:fields]).map { |field| compile_legacy_field(field) }.compact
      step_id = step[:id].presence || step[:title].to_s.parameterize(separator: '_')
      step_id = "step_#{index + 1}" if step_id.blank?

      {
        id: step_id,
        title: step[:title],
        description: step[:description].presence,
        fields: fields
      }.compact
    end

    def compile_legacy_field(field)
      field = normalize_object(field)
      key = field[:key].to_s
      return if key.blank?

      target = LeadWizard::FieldTargets.normalize(field[:target], key: key)

      {
        key: key,
        target: target,
        type: field[:type].presence || 'text',
        label: field[:label].presence || key.humanize,
        placeholder: field[:placeholder].presence,
        required: truthy?(field[:required]),
        options: normalize_options(field[:options]),
        min: field[:min].presence && field[:min].to_f,
        max: field[:max].presence && field[:max].to_f,
        step: field[:step].presence && field[:step].to_f,
        errorMessage: field[:errorMessage].presence || field[:error_message].presence,
        dependsOn: normalize_depends_on(field[:dependsOn] || field[:depends_on])
      }.compact
    end

    def normalize_options(options)
      Array(options).map do |option|
        option = normalize_object(option)
        {
          label: option[:label].presence || option[:value].to_s,
          value: coerce_scalar(option[:value])
        }
      end.presence
    end

    def normalize_depends_on(depends_on)
      depends_on = normalize_object(depends_on)
      return if depends_on.blank?
      return if depends_on[:field].blank?

      {
        field: depends_on[:field],
        value: coerce_scalar(depends_on[:value])
      }.compact
    end

    def resolve_availability
      return {
        preferred_company_id: nil,
        company_available: true,
        reason: 'not_requested'
      } if @preferred_company_id.blank?

      company = Company.find_by(id: @preferred_company_id, status: 'active')

      unless company
        return {
          preferred_company_id: @preferred_company_id,
          company_available: false,
          reason: 'preferred_company_not_found',
          message: 'Empresa preferida não encontrada ou inativa'
        }
      end

      if company.categories.exists?(id: @category_id)
        {
          preferred_company_id: company.id,
          company_available: true,
          reason: 'company_available'
        }
      else
        {
          preferred_company_id: company.id,
          company_available: false,
          reason: 'company_not_in_category',
          message: 'Empresa preferida não atende esta categoria'
        }
      end
    end

    def normalize_object(value)
      return {} unless value.is_a?(Hash)

      value.deep_symbolize_keys
    end

    def truthy?(value)
      %w[true 1 yes sim].include?(value.to_s.downcase)
    end

    def coerce_scalar(value)
      return value if value.nil? || value.is_a?(Numeric) || value == true || value == false

      string_value = value.to_s.strip
      return true if string_value.casecmp('true').zero?
      return false if string_value.casecmp('false').zero?
      return string_value.to_i if string_value.match?(/\A-?\d+\z/)
      return string_value.to_f if string_value.match?(/\A-?\d+\.\d+\z/)

      string_value
    end
  end
end
