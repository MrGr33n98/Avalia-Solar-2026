# frozen_string_literal: true

ActiveAdmin.register ContentLead do
  actions :index, :show
  includes :company
  filter :company
  filter :email
  filter :created_at
  filter :last_seen_at

  index do
    id_column
    column :company
    column :name
    column :email
    column :phone
    column :last_seen_at
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :company
      row :name
      row :email
      row :phone
      row :company_name
      row :consents
      row :last_seen_at
      row :created_at
    end
    panel 'Downloads autorizados' do
      table_for resource.material_downloads.order(created_at: :desc) do
        column(:material) { |download| download.company_material.title }
        column :delivery_status
        column :authorized_at
        column :delivered_at
      end
    end
  end
end
