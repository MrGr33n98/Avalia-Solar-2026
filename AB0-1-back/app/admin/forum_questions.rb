ActiveAdmin.register ForumQuestion do
  permit_params :subject, :description, :status, :requested_at, :user_id, :product_id, :company_id, :category_id

  filter :subject
  filter :category
  filter :company
  filter :product
  filter :user
  filter :status
  filter :requested_at
  filter :created_at

  index do
    selectable_column
    id_column
    column :subject
    column :user
    column :company
    column :product
    column :category
    column :status
    column :requested_at
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :subject
      f.input :description
      f.input :user
      f.input :company
      f.input :product
      f.input :category
      f.input :status
      f.input :requested_at
    end
    f.actions
  end
end
