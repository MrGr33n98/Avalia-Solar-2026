ActiveAdmin.register User do
  # Remove any reference to Post model
  permit_params :email, :password, :password_confirmation, :name

  # Define explicit filters without Post references
  filter :email
  filter :name
  filter :created_at
  filter :updated_at

  # Remove any filter that might be causing the issue
  remove_filter :posts

  index do
    selectable_column
    id_column
    column :email
    column :name
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :email
      f.input :name
      f.input :password
      f.input :password_confirmation
    end
    f.actions
  end
end
