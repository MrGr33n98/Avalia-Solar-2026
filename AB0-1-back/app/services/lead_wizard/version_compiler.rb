# frozen_string_literal: true

module LeadWizard
  class VersionCompiler
    def self.call(version)
      new(version).call
    end

    def initialize(version)
      @version = version
    end

    def call
      {
        steps: compile_steps,
        ui_config: compile_ui_config
      }.compact
    end

    def thank_you_config
      {
        title: @version.thank_you_title.presence,
        message: @version.thank_you_message.presence,
        redirect_url: @version.thank_you_redirect_url.presence
      }.compact
    end

    private

    def compile_steps
      @version.lead_wizard_sections
              .includes(lead_wizard_fields: :lead_wizard_field_options)
              .order(:position, :id)
              .map do |section|
        {
          id: section.key,
          title: section.title,
          description: section.description.presence,
          fields: section.lead_wizard_fields.order(:position, :id).map { |field| compile_field(field) }.compact
        }.compact
      end
    end

    def compile_ui_config
      {
        theme: @version.ui_theme.presence || 'auto',
        primary_color: @version.ui_primary_color.presence,
        logo_url: @version.ui_logo_url.presence,
        show_progress_bar: @version.show_progress_bar
      }.compact
    end

    def compile_field(field)
      {
        key: field.key,
        target: LeadWizard::FieldTargets.normalize(field.target, key: field.key),
        type: field.field_type,
        label: field.label,
        placeholder: field.placeholder.presence,
        required: field.required,
        options: compile_options(field),
        min: field.min_value&.to_f,
        max: field.max_value&.to_f,
        step: field.step_value&.to_f,
        errorMessage: field.error_message.presence,
        dependsOn: compile_depends_on(field)
      }.compact
    end

    def compile_options(field)
      options = field.lead_wizard_field_options.order(:position, :id).map do |option|
        {
          label: option.label,
          value: coerce_scalar(option.value)
        }
      end

      options.presence
    end

    def compile_depends_on(field)
      return if field.depends_on_field_key.blank?

      {
        field: field.depends_on_field_key,
        value: coerce_scalar(field.depends_on_value)
      }.compact
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
