# frozen_string_literal: true

ActiveAdmin.register LeadWizardFieldOption do
  menu parent: 'Lead Wizards', priority: 23
  actions :all, except: [:destroy]
  config.batch_actions = false

  permit_params :lead_wizard_field_id, :label, :value, :position

  filter :lead_wizard_field_lead_wizard_section_lead_wizard_version
  filter :label
  filter :value
  filter :created_at

  controller do
    def scoped_collection
      super.includes(lead_wizard_field: { lead_wizard_section: :lead_wizard_version })
    end
  end

  index do
    selectable_column
    id_column
    column :lead_wizard_field
    column :position
    column :label
    column :value
    column :updated_at
    actions
  end

  form do |f|
    f.semantic_errors

    f.inputs 'Option Settings' do
      f.input :lead_wizard_field,
              collection: LeadWizardField.order(:position,
                                                :id).includes(lead_wizard_section: :lead_wizard_version).map { |field|
                [
                  "#{field.lead_wizard_section.lead_wizard_version.scope_label} / #{field.lead_wizard_section.title} / #{field.label}", field.id
                ]
              }
      f.input :label
      f.input :value
      f.input :position
    end

    f.actions
  end

  show do
    attributes_table do
      row :lead_wizard_field
      row :position
      row :label
      row :value
      row :created_at
      row :updated_at
    end
  end
end
