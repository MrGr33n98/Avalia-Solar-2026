ActiveAdmin.register CompanyFinancingProfile do
  permit_params :company_id, :title, :subtitle, :disclaimer, :cta_label, :cta_url,
                :currency, :status, :default_amount_cents, :min_amount_cents, :max_amount_cents,
                :default_down_payment_percent, :min_down_payment_percent, :max_down_payment_percent,
                :default_term_months, :min_term_months, :max_term_months,
                :default_interest_rate_monthly, :min_interest_rate_monthly, :max_interest_rate_monthly,
                :grace_months_enabled, :max_grace_months, :amortization_type,
                :show_bank_logos, :show_fee_inputs

  index do
    selectable_column
    id_column
    column :company
    column :title
    column :status
    column :currency
    column :amortization_type
    column :show_bank_logos
    actions
  end

  filter :company
  filter :status

  form do |f|
    f.inputs do
      f.input :company
      f.input :status, as: :select, collection: CompanyFinancingProfile.statuses.keys
      f.input :title
      f.input :subtitle
      f.input :disclaimer
      f.input :cta_label
      f.input :cta_url
      f.input :currency
      f.input :amortization_type, as: :select, collection: CompanyFinancingProfile::AMORTIZATION_TYPES
      f.input :grace_months_enabled
      f.input :max_grace_months
      f.input :show_bank_logos
      f.input :show_fee_inputs
    end

    f.inputs 'Faixas e padrões' do
      f.input :default_amount_cents
      f.input :min_amount_cents
      f.input :max_amount_cents
      f.input :default_down_payment_percent
      f.input :min_down_payment_percent
      f.input :max_down_payment_percent
      f.input :default_term_months
      f.input :min_term_months
      f.input :max_term_months
      f.input :default_interest_rate_monthly
      f.input :min_interest_rate_monthly
      f.input :max_interest_rate_monthly
    end

    f.actions
  end
end
