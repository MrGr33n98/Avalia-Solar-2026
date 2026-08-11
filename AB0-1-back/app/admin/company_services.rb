ActiveAdmin.register CompanyService do
  menu false
  permit_params :company_id, :category_id, :name, :slug, :description, :price_from, :status, coverage: []

  filter :company
  filter :category
  filter :name
  filter :status, as: :select, collection: CompanyService.statuses

  index do
    selectable_column
    id_column
    column :company
    column :category
    column :name
    column :price_from
    column :status
    actions
  end
end
