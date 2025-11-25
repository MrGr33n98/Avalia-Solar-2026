ActiveAdmin.register Article do
  permit_params :title, :content, :category_id, :product_id, :company_id, :sponsored, :sponsored_label

  filter :title
  filter :category
  filter :company
  filter :product
  filter :sponsored
  filter :created_at

  index do
    selectable_column
    id_column
    column :title
    column :category
    column :company
    column :product
    column :sponsored
    column :sponsored_label
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :title
      f.input :content
      f.input :category
      f.input :company
      f.input :product
      f.input :sponsored
      f.input :sponsored_label
    end
    f.actions
  end
end
