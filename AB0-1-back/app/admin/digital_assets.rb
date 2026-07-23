# frozen_string_literal: true

ActiveAdmin.register DigitalAsset do
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
    reason = params[:reason].presence || 'Ativo bloqueado pela moderação.'
    resource.update!(status: 'quarantined', processing_status: 'quarantined')
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'quarantined', reason: reason)
    redirect_to resource_path, alert: 'Ativo colocado em quarentena.'
  end

  action_item :approve, only: :show, if: proc { resource.status == 'pending' } do
    link_to 'Aprovar ativo', approve_admin_digital_asset_path(resource), method: :put
  end

  action_item :quarantine, only: :show, if: proc { resource.status != 'quarantined' } do
    link_to 'Colocar em quarentena', quarantine_admin_digital_asset_path(resource), method: :put, data: { confirm: 'Colocar este ativo em quarentena?' }
  end
end
