ActiveAdmin.register Sales::Account, as: 'Sales Account' do
  menu label: 'CRM · Accounts'
  permit_params :name, :company_id, :owner_id, :domain, :website, :email, :phone, :segment, :status
  index do
    selectable_column
    id_column
    column :name
    column :company
    column :owner
    column :status
    column :created_at
    actions
  end
  filter :name
  filter :status
  filter :owner
end
