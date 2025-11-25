ActiveAdmin.register Plan do
  # Update the permitted parameters if needed
  permit_params :name, :description, :price

  # Fix the filters section - remove any reference to 'features'
  filter :name
  filter :description
  filter :price
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column :name
    column :description
    column :price
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :name
      f.input :description
      f.input :price
    end
    f.actions
  end
end
