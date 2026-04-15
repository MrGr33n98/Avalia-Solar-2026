# frozen_string_literal: true

ActiveAdmin.register LeadWizardField do
  menu parent: 'Lead Wizards', priority: 22

  permit_params :lead_wizard_section_id, :key, :field_type, :label, :target,
                :placeholder, :help_text, :required, :position, :min_value,
                :max_value, :step_value, :error_message, :depends_on_field_key,
                :depends_on_operator, :depends_on_value, :default_value,
                :choice_options_text

  filter :lead_wizard_section_lead_wizard_version
  filter :field_type, as: :select, collection: proc { LeadWizardField::FIELD_TYPES }
  filter :target, as: :select, collection: proc { LeadWizardField::TARGETS }
  filter :key
  filter :label
  filter :created_at

  action_item :new_option, only: :show do
    link_to 'New Option', new_admin_lead_wizard_field_option_path(lead_wizard_field_option: { lead_wizard_field_id: resource.id })
  end

  controller do
    def scoped_collection
      super.includes(:lead_wizard_section, lead_wizard_field_options: :lead_wizard_field)
    end

    def create
      @lead_wizard_field = LeadWizardField.new(field_params)
      apply_choice_options_for_validation(@lead_wizard_field)

      persist_field_with_choice_options!(@lead_wizard_field, choice_options_text_param)

      redirect_to resource_path(@lead_wizard_field), notice: 'Lead wizard field created.'
    rescue ActiveRecord::RecordInvalid => e
      @lead_wizard_field ||= e.record if e.record.is_a?(LeadWizardField)
      attach_nested_option_error(@lead_wizard_field, e)
      render :new, status: :unprocessable_entity
    end

    def update
      resource.assign_attributes(field_params)
      apply_choice_options_for_validation(resource)

      persist_field_with_choice_options!(resource, choice_options_text_param)

      redirect_to resource_path(resource), notice: 'Lead wizard field updated.'
    rescue ActiveRecord::RecordInvalid => e
      attach_nested_option_error(resource, e)
      render :edit, status: :unprocessable_entity
    end

    private

    def field_params
      params.require(:lead_wizard_field).permit(
        :lead_wizard_section_id, :key, :field_type, :label, :target,
        :placeholder, :help_text, :required, :position, :min_value,
        :max_value, :step_value, :error_message, :depends_on_field_key,
        :depends_on_operator, :depends_on_value, :default_value
      )
    end

    def choice_options_text_param
      params.dig(:lead_wizard_field, :choice_options_text).to_s
    end

    def apply_choice_options_for_validation(field)
      return unless choice_field?(field)
      return unless field.lead_wizard_field_options.empty?

      parsed_choice_options(choice_options_text_param).each do |attrs|
        field.lead_wizard_field_options.build(attrs)
      end
    end

    def persist_field_with_choice_options!(field, choice_options_text)
      parsed_options = parsed_choice_options(choice_options_text)

      LeadWizardField.transaction do
        field.save!
        persist_choice_options!(field, parsed_options)
      end
    end

    def persist_choice_options!(field, parsed_options)
      if choice_field?(field)
        return if parsed_options.blank?

        field.lead_wizard_field_options.destroy_all if field.persisted?
        parsed_options.each { |attrs| field.lead_wizard_field_options.create!(attrs) }
        field.association(:lead_wizard_field_options).reset
      elsif field.lead_wizard_field_options.exists?
        field.lead_wizard_field_options.destroy_all
      end
    end

    def parsed_choice_options(choice_options_text)
      choice_options_text.to_s.split(/\r?\n/).map(&:strip).reject(&:blank?).each_with_index.map do |line, index|
        label, value = line.split('|', 2).map { |part| part&.strip }
        label = line if label.blank?
        value = label.to_s.parameterize if value.blank?

        {
          label: label,
          value: value,
          position: index
        }
      end
    end

    def choice_field?(field)
      field.field_type.in?(%w[select radio])
    end

    def attach_nested_option_error(field, error)
      return if field.blank?

      if error.record.is_a?(LeadWizardFieldOption)
        field.errors.add(:lead_wizard_field_options, error.record.errors.full_messages.to_sentence)
      end
    end
  end

  index do
    selectable_column
    id_column
    column :lead_wizard_section
    column :position
    column :key
    column :label
    column :field_type
    column :target
    column :required
    column('Options') { |field| field.lead_wizard_field_options.size }
    column :updated_at
    actions
  end

  form do |f|
    f.semantic_errors

    f.inputs 'Field Settings' do
      f.input :lead_wizard_section,
              collection: LeadWizardSection.order(:position, :id).includes(:lead_wizard_version).map { |section|
                ["#{section.lead_wizard_version.scope_label} / #{section.title}", section.id]
              }
      f.input :key, hint: 'Chave estável do campo. Ex: full_name, project_profile.'
      f.input :label
      f.input :field_type, as: :select, collection: LeadWizardField::FIELD_TYPES.map { |type| [type.humanize, type] }
      f.input :target, as: :select, collection: LeadWizardField::TARGETS.map { |target| [target.humanize, target] }, hint: 'Se vazio, o sistema infere pelo nome do campo.'
      f.input :placeholder
      f.input :help_text, as: :text, input_html: { rows: 3 }
      f.input :required
      f.input :position
    end

    f.inputs 'Constraints & Logic' do
      f.input :min_value
      f.input :max_value
      f.input :step_value
      f.input :error_message
      f.input :depends_on_field_key
      f.input :depends_on_operator, hint: 'Ex: equals, not_equals, greater_than, less_than.'
      f.input :depends_on_value
      f.input :default_value
    end

    f.inputs 'Choice Options' do
      choice_options_text =
        params.dig(:lead_wizard_field, :choice_options_text).presence ||
        resource.lead_wizard_field_options.order(:position, :id).map { |option| "#{option.label}|#{option.value}" }.join("\n")

      f.template.concat(
        f.template.content_tag(:li, class: 'string input') do
          f.template.safe_join(
            [
              f.template.label_tag('lead_wizard_field_choice_options_text', 'Choice Options'),
              f.template.content_tag(
                :p,
                'Use one line per option in the format Label|value. Example: Residencial|residencial',
                class: 'inline-hints'
              ),
              f.template.text_area_tag(
                'lead_wizard_field[choice_options_text]',
                choice_options_text,
                rows: 6,
                style: 'width: 100%; min-height: 180px;'
              )
            ]
          )
        end
      )
    end

    f.actions
  end

  show do
    attributes_table do
      row :lead_wizard_section
      row :position
      row :key
      row :label
      row :field_type
      row :target
      row :placeholder
      row :help_text
      row :required
      row :min_value
      row :max_value
      row :step_value
      row :error_message
      row :depends_on_field_key
      row :depends_on_operator
      row :depends_on_value
      row :default_value
      row :created_at
      row :updated_at
    end

    panel 'Options' do
      table_for resource.lead_wizard_field_options.order(:position, :id) do
        column :position
        column :label
        column :value
        column :updated_at
      end
    end
  end
end
