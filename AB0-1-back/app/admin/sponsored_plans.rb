ActiveAdmin.register SponsoredPlan do
  menu label: 'SAAS - Patrocinados', priority: 20

  permit_params :member_id, :product_id, :category_id, :plan_id, :custom_cta, :active, :purchased_at, :start_at, :end_at

  filter :member_id, label: 'Cliente (ID)'
  filter :product
  filter :category
  filter :plan
  filter :active
  filter :purchased_at
  filter :start_at
  filter :end_at
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column('Cliente') { |record| record.member_id.presence || '-' }
    column :product
    column :category
    column :plan
    column('Ativo?') do |record|
      status_tag(record.active? ? 'Ativo' : 'Inativo', class: record.active? ? 'ok' : 'warning')
    end
    column :start_at
    column :end_at
    column :created_at
    actions
  end

  form do |f|
    f.inputs 'Patrocinio SaaS' do
      f.input :member_id, label: 'Cliente (ID do User)'
      f.input :product
      f.input :category
      f.input :plan
      f.input :custom_cta
      f.input :active
      f.input :purchased_at
      f.input :start_at
      f.input :end_at
    end
    f.actions
  end
end
