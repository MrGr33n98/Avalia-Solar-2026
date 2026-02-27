# frozen_string_literal: true

module LeadWizard
  class Resolver
    DEFAULT_TEMPLATE_KEY = 'solar'
    DEFAULT_TEMPLATE_VERSION = 1
    DEFAULT_SCHEMA = {
      steps: [
        {
          id: 'step_1',
          fields: [
            { key: 'project_profile', type: 'select', label: 'Perfil do Projeto', required: true, options: [
              { label: 'Residencial', value: 'residential' },
              { label: 'Comercial', value: 'commercial' },
              { label: 'Industrial', value: 'industrial' },
              { label: 'Rural', value: 'rural' }
            ]},
            { key: 'system_size_band', type: 'select', label: 'Tamanho do Sistema', required: true, options: [
              { label: 'Até 7 kWp', value: 'up_to_7_kwp' },
              { label: '8 kWp ou mais', value: '8_kwp_plus' },
              { label: 'Não sei', value: 'dont_know' }
            ]},
            { key: 'decision_timeline', type: 'select', label: 'Prazo de Decisão', required: true, options: [
              { label: 'Imediato', value: 'immediate' },
              { label: 'Em 3 meses', value: '3_months' },
              { label: 'Em 6 meses', value: '6_months' },
              { label: 'Apenas pesquisando', value: 'researching' }
            ]}
          ]
        }
      ]
    }.freeze

    def self.resolve(category_id:, preferred_company_id: nil)
      new(category_id: category_id, preferred_company_id: preferred_company_id).resolve
    end

    def initialize(category_id:, preferred_company_id: nil)
      @category_id = category_id
      @preferred_company_id = preferred_company_id
    end

    def resolve
      config = CategoryLeadWizard.find_by(category_id: @category_id, enabled: true)

      if config&.schema.present?
        {
          source: 'category',
          category_id: @category_id,
          template_key: config.template_key,
          template_version: config.template_version,
          schema: config.schema,
          thank_you_config: config.thank_you_config
        }
      else
        {
          source: 'default',
          category_id: @category_id,
          template_key: DEFAULT_TEMPLATE_KEY,
          template_version: DEFAULT_TEMPLATE_VERSION,
          schema: DEFAULT_SCHEMA,
          thank_you_config: {}
        }
      end
    end
  end
end
