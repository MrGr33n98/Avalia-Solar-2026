# frozen_string_literal: true

module LeadWizard
  class Resolver
    DEFAULT_TEMPLATE_KEY = 'solar'
    DEFAULT_TEMPLATE_VERSION = 1
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
      config = CategoryLeadWizard.find_by(category_id: @category_id, enabled: true)

      payload =
        if config&.schema.present?
          {
          source: 'category',
          category_id: @category_id,
          template_key: config.template_key,
          template_version: config.template_version,
          schema: normalize_object(config.schema),
          thank_you_config: normalize_object(config.thank_you_config)
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

      payload.merge(availability: availability)
    end

    private

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
  end
end
