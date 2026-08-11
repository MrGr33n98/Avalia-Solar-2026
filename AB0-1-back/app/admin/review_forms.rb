ActiveAdmin.register ReviewForm do
  menu false
  permit_params :company_id, :name, :public_title, :public_description, :form_type, :status, :is_default

  includes :company
  filter :company
  filter :status
  filter :form_type
  filter :created_at

  index do
    selectable_column
    id_column
    column :company
    column :name
    column :form_type
    column :status
    column('Avaliações') { |form| form.reviews.count }
    column :created_at
    actions
  end
end
