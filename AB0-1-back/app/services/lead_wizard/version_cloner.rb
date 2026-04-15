# frozen_string_literal: true

module LeadWizard
  class VersionCloner
    def self.call(version)
      new(version).call
    end

    def initialize(version)
      @version = version
    end

    def call
      LeadWizardVersion.transaction do
        clone = @version.dup
        clone.status = 'draft'
        clone.version_number = LeadWizardVersion.next_version_number_for(
          company_id: @version.company_id,
          category_id: @version.category_id
        )
        clone.published_at = nil
        clone.archived_at = nil
        clone.save!

        @version.lead_wizard_sections.order(:position, :id).each do |section|
          cloned_section = clone.lead_wizard_sections.create!(
            key: section.key,
            title: section.title,
            description: section.description,
            position: section.position
          )

          section.lead_wizard_fields.order(:position, :id).each do |field|
            cloned_field = cloned_section.lead_wizard_fields.create!(
              key: field.key,
              field_type: field.field_type,
              label: field.label,
              target: field.target,
              placeholder: field.placeholder,
              help_text: field.help_text,
              required: field.required,
              position: field.position,
              min_value: field.min_value,
              max_value: field.max_value,
              step_value: field.step_value,
              error_message: field.error_message,
              depends_on_field_key: field.depends_on_field_key,
              depends_on_value: field.depends_on_value,
              depends_on_operator: field.depends_on_operator,
              default_value: field.default_value
            )

            field.lead_wizard_field_options.order(:position, :id).each do |option|
              cloned_field.lead_wizard_field_options.create!(
                label: option.label,
                value: option.value,
                position: option.position
              )
            end
          end
        end

        clone
      end
    end
  end
end
