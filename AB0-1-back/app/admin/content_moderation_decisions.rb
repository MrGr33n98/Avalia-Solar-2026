# frozen_string_literal: true

ActiveAdmin.register ContentModerationDecision do
  actions :index, :show
  includes :company, :admin_user, :moderatable
  filter :company
  filter :admin_user
  filter :decision
  filter :moderatable_type
  filter :created_at

  index do
    id_column
    column :company
    column :moderatable
    column :decision
    column :admin_user
    column :reason
    column :created_at
    actions
  end
end
