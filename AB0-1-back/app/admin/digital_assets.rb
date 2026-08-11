# frozen_string_literal: true

ActiveAdmin.register DigitalAsset do
  menu false
  includes :company, :attachable
  actions :all, except: %i[new create]
  filter :company
  filter :kind
  filter :status
  filter :processing_status
  filter :created_at

  index do
    selectable_column
    id_column
    column :company
    column :attachable
    column :kind
    column :title
    column :status
    column :processing_status
    column :created_at
    actions
  end

  member_action :approve, method: :put do
    resource.update!(status: 'published', processing_status: 'ready')
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'approved')
    redirect_to resource_path, notice: 'Ativo aprovado.'
  end

  member_action :quarantine, method: :put do
    reason = params[:reason].to_s.strip
    return redirect_to(resource_path, alert: 'Informe o motivo da quarentena.') if reason.blank?

    resource.update!(status: 'quarantined', processing_status: 'quarantined')
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'quarantined', reason: reason)
    redirect_to resource_path, alert: 'Ativo colocado em quarentena.'
  end

  action_item :approve, only: :show, if: proc { resource.status == 'pending' } do
    link_to 'Aprovar ativo', approve_admin_digital_asset_path(resource), method: :put
  end

  sidebar 'Quarentena', only: :show, if: proc { resource.status != 'quarantined' } do
    div class: 'panel_contents' do
      para 'A quarentena interrompe a exposição do ativo e exige justificativa para auditoria.'
      form action: quarantine_admin_digital_asset_path(resource), method: :post do
        input type: :hidden, name: :_method, value: :put
        textarea name: :reason, required: true, placeholder: 'Motivo da quarentena', rows: 4
        input type: :submit, value: 'Colocar em quarentena'
      end
    end
  end
end
