# frozen_string_literal: true

ActiveAdmin.register ContentLeadForm do
  menu false
  permit_params :company_id, :name, :status, :consent_text, :privacy_url, fields: %i[key label type required options]
  includes :company, :company_materials
  filter :company
  filter :status
  filter :created_at

  index do
    selectable_column
    id_column
    column :company
    column :name
    column :status
    column :version
    column('Materiais') { |form| form.company_materials.count }
    column :updated_at
    actions
  end

  show do
    attributes_table do
      row :company
      row :name
      row :status
      row :version
      row :privacy_url
      row :consent_text
      row :fields
      row :created_at
      row :updated_at
    end
  end
end
