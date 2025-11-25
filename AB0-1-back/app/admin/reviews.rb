ActiveAdmin.register Review do
  # Explicitly define filters to match your model's attributes
  filter :comment
  filter :rating
  filter :company
  filter :user
  filter :created_at
  filter :updated_at

  # Update the permitted parameters to use comment instead of content
  permit_params :comment, :rating, :company_id, :user_id

  # Fix the filters section - use comment instead of content
  filter :comment
  filter :rating
  filter :company
  filter :user
  filter :created_at
  filter :updated_at

  # Remove any default filters that might be causing the issue
  remove_filter :content

  index do
    selectable_column
    id_column
    column :company
    column :user
    column :rating
    column :comment
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :company
      f.input :user
      f.input :rating
      f.input :comment # Changed from content to comment
    end
    f.actions
  end
end
