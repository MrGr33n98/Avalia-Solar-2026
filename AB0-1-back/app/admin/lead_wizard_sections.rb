# frozen_string_literal: true

ActiveAdmin.register LeadWizardSection do
  menu parent: 'Lead Wizards', priority: 21

  permit_params :lead_wizard_version_id, :key, :title, :description, :position

  filter :lead_wizard_version
  filter :key
  filter :title
  filter :created_at

  action_item :new_field, only: :show do
    link_to 'New Field', new_admin_lead_wizard_field_path(lead_wizard_field: { lead_wizard_section_id: resource.id })
  end

  controller do
    def scoped_collection
      super.includes(:lead_wizard_version, lead_wizard_fields: :lead_wizard_field_options)
    end
  end

  index do
    selectable_column
    id_column
    column :lead_wizard_version
    column :position
    column :key
    column :title
    column('Fields') { |section| section.lead_wizard_fields.size }
    column :updated_at
    actions
  end

  form do |f|
    f.semantic_errors

    f.inputs 'Section Settings' do
      f.input :lead_wizard_version,
              collection: LeadWizardVersion.latest_first.map { |version|
                ["#{version.scope_label} v#{version.version_number}", version.id]
              },
              include_blank: false
      f.input :key, hint: 'Identificador estável da seção. Ex: contact_info, project_details.'
      f.input :title
      f.input :description, as: :text, input_html: { rows: 3 }
      f.input :position
    end

    f.actions
  end

  show do
    attributes_table do
      row :lead_wizard_version
      row :position
      row :key
      row :title
      row :description
      row :created_at
      row :updated_at
    end

    panel 'Fields' do
      table_for resource.lead_wizard_fields.order(:position, :id) do
        column :position
        column :key
        column :label
        column :field_type
        column :target
        column :required
        column('Options') { |field| field.lead_wizard_field_options.size }
        column('Actions') do |field|
          link_to 'Open', admin_lead_wizard_field_path(field)
        end
      end
    end
  end
end
