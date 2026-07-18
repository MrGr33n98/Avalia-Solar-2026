ActiveAdmin.register ProductOffer do
  permit_params :company_product_id, :price, :stock, :lead_time_days, :installation_available,
                :commercial_terms, :status, coverage: []

  filter :company_product
  filter :status, as: :select, collection: ProductOffer.statuses

  index do
    selectable_column
    id_column
    column('Empresa') { |offer| offer.company_product.company.name }
    column('Produto') { |offer| offer.company_product.product.name }
    column :price
    column :stock
    column :lead_time_days
    column :installation_available
    column :status
    actions
  end
end
