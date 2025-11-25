ActiveAdmin.register ProductAccess do
  # Update the permitted parameters if needed
  permit_params :product_id, :user_id

  # Explicitly define filters to avoid the status_cont error
  filter :product
  filter :user
  filter :created_at
  filter :updated_at

  # Remove any default filters that might be causing the issue
  remove_filter :status

  index do
    selectable_column
    id_column
    column :product
    column :user
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :product
      f.input :user
    end
    f.actions
  end
end
