ActiveAdmin.register Pricing do
  # Update the permitted parameters if needed
  permit_params :price, :product_id

  # Fix the filters section - remove any reference to 'title'
  filter :product
  filter :price
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column :product
    column :price
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :product
      f.input :price
    end
    f.actions
  end
end
