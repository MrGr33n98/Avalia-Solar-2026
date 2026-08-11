# frozen_string_literal: true

ActiveAdmin.register MaterialDownload do
  menu false
  actions :index, :show
  includes :company, :company_material, :content_lead
  filter :company
  filter :company_material
  filter :delivery_status
  filter :created_at
  filter :delivered_at

  index do
    id_column
    column :company
    column(:material) { |download| download.company_material.title }
    column(:lead) { |download| download.content_lead&.email || 'Anônimo' }
    column :delivery_status
    column :authorized_at
    column :delivered_at
    actions
  end
end
