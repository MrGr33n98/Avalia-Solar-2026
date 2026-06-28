# frozen_string_literal: true

ActiveAdmin.register Billing::AdminAction do
  menu label: 'Billing — Auditoria', priority: 21, parent: 'Billing'

  # Apenas leitura
  actions :index, :show

  filter :action_type, as: :select, collection: -> { Billing::AdminAction.pluck(:action_type).uniq }
  filter :admin_user
  filter :company
  filter :performed_at

  index title: 'Billing — Histórico de Auditoria' do
    id_column
    column('Data') { |a| a.performed_at&.strftime('%d/%m/%Y %H:%M') || '—' }
    column('Admin') { |a| a.admin_user&.email }
    column('Empresa') { |a| a.company&.name }
    column('Ação') { |a| status_tag a.action_type }
    column('Justificativa') { |a| truncate(a.justification, length: 80) }
    actions defaults: false do |a|
      item 'Ver', admin_billing_admin_action_path(a), class: 'member_link'
    end
  end

  show title: proc { |a| "Ação Admin ##{a.id}" } do
    attributes_table do
      row :id
      row('Data') { resource.performed_at&.strftime('%d/%m/%Y %H:%M:%S') || '—' }
      row('Admin') { resource.admin_user&.email }
      row('Empresa') { resource.company ? link_to(resource.company.name, admin_company_path(resource.company)) : '—' }
      row('Ação') { status_tag resource.action_type }
      row('Justificativa') { resource.justification }
      row('Metadados') do
        if resource.metadata.present?
          pre JSON.pretty_generate(resource.metadata)
        else
          '—'
        end
      end
      row('Endereço IP') { resource.ip_address || '—' }
    end
  end
end
