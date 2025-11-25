ActiveAdmin.register Product do
  # Your existing permit_params
  permit_params :name, :description, :price, :image_url, :company_id, category_ids: []

  # Explicitly define filters to avoid the error
  filter :name
  filter :description
  filter :price
  filter :company
  filter :created_at
  # Remove the automatic categories filter that's causing the error
  remove_filter :categories

  form do |f|
    f.inputs do
      f.input :name
      f.input :description
      f.input :price
      f.input :image_url
      f.input :company

      # Add categories checkbox
      f.input :categories, as: :check_boxes
    end
    f.actions
  end

  # Rest of your ActiveAdmin configuration...
end
