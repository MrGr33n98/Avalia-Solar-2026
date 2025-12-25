ActiveAdmin.register BannerSubscription do
  permit_params :company_id, :banner_offer_id, :status, :provider, :checkout_session_id, :payment_reference, :starts_at, :ends_at

  index do
    selectable_column
    id_column
    column :company
    column :banner_offer
    column :status
    column :provider
    column :starts_at
    column :ends_at
    column :created_at
    actions
  end

  filter :company
  filter :status
  filter :provider
  filter :created_at

  show do
    attributes_table do
      row :id
      row :company
      row :banner_offer
      row :status
      row :provider
      row :checkout_session_id
      row :payment_reference
      row :starts_at
      row :ends_at
      row :activated_at
      row :canceled_at
      row :failure_reason
      row :metadata_json do |s|
        pre JSON.pretty_generate(s.metadata_json || {})
      end
      row :created_at
      row :updated_at
    end
  end
end
