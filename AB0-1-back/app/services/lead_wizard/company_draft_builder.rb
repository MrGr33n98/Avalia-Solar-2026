# frozen_string_literal: true

module LeadWizard
  class CompanyDraftBuilder
    def self.ensure_draft!(company:)
      new(company).ensure_draft!
    end

    def initialize(company)
      @company = company
    end

    def ensure_draft!
      return versions.draft.latest_first.first if versions.draft.exists?
      published = versions.published.latest_first.first
      return VersionCloner.call(published) if published

      payload = Resolver.resolve(category_id: @company.categories.order(:id).pick(:id), preferred_company_id: @company.id)
      build_from_payload(payload)
    end

    private
    def versions = LeadWizardVersion.where(company_id: @company.id)

    def build_from_payload(payload)
      LeadWizardVersion.transaction do
        version = LeadWizardVersion.create!(company: @company, template_key: payload[:template_key], template_version: payload[:template_version], status: :draft,
          ui_theme: payload.dig(:schema, :ui_config, :theme), ui_primary_color: payload.dig(:schema, :ui_config, :primary_color), ui_logo_url: payload.dig(:schema, :ui_config, :logo_url),
          show_progress_bar: payload.dig(:schema, :ui_config, :show_progress_bar), thank_you_title: payload.dig(:thank_you_config, :title), thank_you_message: payload.dig(:thank_you_config, :message), thank_you_redirect_url: payload.dig(:thank_you_config, :redirect_url))
        Array(payload.dig(:schema, :steps)).each_with_index { |step, i| create_section(version, step, i) }
        version
      end
    end

    def create_section(version, raw, position)
      step = raw.deep_symbolize_keys
      section = version.lead_wizard_sections.create!(key: step[:id].presence || "step_#{position + 1}", title: step[:title].presence || "Etapa #{position + 1}", description: step[:description], position: position)
      Array(step[:fields]).each_with_index { |field, i| create_field(section, field, i) }
    end

    def create_field(section, raw, position)
      field = raw.deep_symbolize_keys
      record = section.lead_wizard_fields.create!(key: field[:key], field_type: field[:type] || 'text', label: field[:label] || field[:key].to_s.humanize, target: field[:target], placeholder: field[:placeholder], required: field[:required], position: position, min_value: field[:min], max_value: field[:max], step_value: field[:step], error_message: field[:errorMessage], depends_on_field_key: field.dig(:dependsOn, :field), depends_on_value: field.dig(:dependsOn, :value))
      Array(field[:options]).each_with_index do |raw_option, i|
        option = raw_option.deep_symbolize_keys
        record.lead_wizard_field_options.create!(label: option[:label], value: option[:value], position: i)
      end
    end
  end
end
