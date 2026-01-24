ActiveAdmin.register CompanyFinancingOffer do
  permit_params :company_id, :name, :offer_type, :term_months, :interest_rate_monthly,
                :min_down_payment_percent, :grace_months, :amortization_type, :notes,
                :active, :position

  includes :company

  index do
    selectable_column
    id_column
    column :company
    column :name
    column :offer_type
    column :term_months
    column :interest_rate_monthly
    column :active
    actions
  end

  filter :company
  filter :offer_type
  filter :active

  form do |f|
    f.inputs do
      f.input :company
      f.input :name
      f.input :offer_type
      f.input :term_months
      f.input :interest_rate_monthly
      f.input :min_down_payment_percent
      f.input :grace_months
      f.input :amortization_type, as: :select, collection: CompanyFinancingOffer::AMORTIZATION_TYPES
      f.input :notes
      f.input :active
      f.input :position
    end
    f.actions
  end
end
