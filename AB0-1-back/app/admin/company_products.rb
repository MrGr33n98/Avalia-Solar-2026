ActiveAdmin.register CompanyProduct do
  menu false
  permit_params :company_id, :product_id, :relationship_type, :status, :authorized, territories: []

  filter :company
  filter :product
  filter :relationship_type, as: :select, collection: CompanyProduct::RELATIONSHIP_TYPES
  filter :status, as: :select, collection: CompanyProduct.statuses
  filter :authorized

  index do
    selectable_column
    id_column
    column :company
    column :product
    column :relationship_type
    column :authorized
    column :status
    actions
  end

  form do |f|
    f.inputs 'Vínculo da empresa com o produto' do
      f.input :company
      f.input :product
      f.input :relationship_type, as: :select, collection: CompanyProduct::RELATIONSHIP_TYPES
      f.input :authorized
      f.input :status, as: :select, collection: CompanyProduct.statuses.keys
      f.input :territories, as: :text, hint: 'JSON com estados, cidades ou regiões atendidas.'
    end
    f.actions
  end
end
