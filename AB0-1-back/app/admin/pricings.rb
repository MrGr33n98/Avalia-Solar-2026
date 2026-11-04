ActiveAdmin.register Pricing do
  menu false
  permit_params :value, :product_id

  filter :product
  filter :value, label: 'Preço'
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column :product
    column 'Preço', :value
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :product
      f.input :value, label: 'Preço'
    end
    f.actions
  end
end
