# frozen_string_literal: true

module LeadWizard
  class CompanyDraftUpdater
    PROTECTED_KEYS = %i[id lead_wizard_version_id created_at updated_at].freeze
    PROTECTED_FIELD_KEYS = %w[full_name email phone zipcode consent].freeze

    def self.call(draft, payload)
      new(draft, payload).call
    end

    def initialize(draft, payload)
      @draft = draft
      @payload = payload.to_h.deep_symbolize_keys
    end

    def call
      LeadWizardVersion.transaction do
        update_version!
        replace_sections!
      end
      @draft
    end

    private

    def update_version!
      ui = hash(@payload[:ui_config])
      thank_you = hash(@payload[:thank_you_config])
      @draft.assign_attributes(
        ui_theme: ui[:theme], ui_primary_color: ui[:primary_color], ui_logo_url: ui[:logo_url],
        show_progress_bar: ui[:show_progress_bar], thank_you_title: thank_you[:title],
        thank_you_message: thank_you[:message], thank_you_redirect_url: thank_you[:redirect_url]
      )
      @draft.save!
    end

    def replace_sections!
      steps = @payload[:steps]
      return unless steps.is_a?(Array)

      @draft.lead_wizard_sections.where.not(id: protected_section_ids).destroy_all
      steps.each_with_index { |raw, index| create_section(raw, index) }
    end

    def create_section(raw, position)
      step = hash(raw)
      section = @draft.lead_wizard_sections.create!(
        key: unique_key(step[:id].presence || "step_#{position + 1}", @draft.lead_wizard_sections),
        title: step[:title].presence || "Etapa #{position + 1}",
        description: step[:description], position: position
      )
      Array(step[:fields]).each_with_index { |field, index| create_field(section, field, index) }
    end

    def create_field(section, raw, position)
      field = hash(raw)
      key = field[:key].presence || field[:id].presence || "field_#{position + 1}"
      return if PROTECTED_FIELD_KEYS.include?(key.to_s)

      record = section.lead_wizard_fields.create!(
        key: unique_key(key, section.lead_wizard_fields), field_type: field[:type].presence || 'text',
        label: field[:label].presence || key.to_s.humanize,
        target: normalize_target(field[:target], key), placeholder: field[:placeholder],
        help_text: field[:help_text], required: field[:required], position: position,
        min_value: field[:min], max_value: field[:max], step_value: field[:step],
        error_message: field[:errorMessage], depends_on_field_key: hash(field[:dependsOn])[:field],
        depends_on_value: hash(field[:dependsOn])[:value], default_value: field[:defaultValue]
      )
      Array(field[:options]).each_with_index { |option, index| create_option(record, option, index) }
    end

    def create_option(field, raw, position)
      option = hash(raw)
      field.lead_wizard_field_options.create!(label: option[:label].to_s, value: option[:value].to_s, position: position)
    end

    def normalize_target(target, key)
      return "wizard_answers" if target.to_s == "custom"

      LeadWizard::FieldTargets.normalize(target, key: key)
    end

    def protected_section_ids
      @draft.lead_wizard_sections.joins(:lead_wizard_fields)
           .where(lead_wizard_fields: { key: PROTECTED_FIELD_KEYS }).distinct.ids
    end

    def unique_key(key, relation)
      base = key.to_s.presence || "item"
      return base unless relation.exists?(key: base)

      suffix = 2
      candidate = "#{base}_#{suffix}"
      while relation.exists?(key: candidate)
        suffix += 1
        candidate = "#{base}_#{suffix}"
      end
      candidate
    end

    def hash(value)
      value.is_a?(Hash) ? value.except(*PROTECTED_KEYS) : {}
    end
  end
end
