ActiveAdmin.register ForumQuestion do
  # Update the permitted parameters to match your model's fields
  permit_params :subject, :description, :status, :requested_at, :user_id, :product_id, :category_id

  index do
    selectable_column
    id_column
    column :subject
    column :user
    column :product
    column :category
    column :status
    column :requested_at
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :subject       # Changed from title
      f.input :description   # Changed from content
      f.input :user
      f.input :product
      f.input :category
      f.input :status
      f.input :requested_at
    end
    f.actions
  end
end
