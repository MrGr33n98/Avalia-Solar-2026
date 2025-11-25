ActiveAdmin.register SponsoredPlan do
  # Update the permitted parameters if needed
  permit_params :category_id, :plan_id, :product_id

  # Fix the filters section - remove any reference to 'member_id'
  filter :category
  filter :plan
  filter :product
  filter :created_at
  filter :updated_at

  # Remove any default filters that might be causing the issue
  remove_filter :member

  index do
    selectable_column
    id_column
    column :category
    column :plan
    column :product
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :category
      f.input :plan
      f.input :product
    end
    f.actions
  end
end
