# frozen_string_literal: true

ActiveAdmin.register ContentLeadExport do
  actions :index, :show
  includes :company, :actor

  filter :company
  filter :actor
  filter :created_at

  index do
    id_column
    column :company
    column :actor
    column :row_count
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :company
      row :actor
      row :row_count
      row :filters
      row :ip_hash
      row :user_agent_hash
      row :created_at
    end
  end
end
