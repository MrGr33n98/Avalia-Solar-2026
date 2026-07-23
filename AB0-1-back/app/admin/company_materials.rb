# frozen_string_literal: true

ActiveAdmin.register CompanyMaterial do
  includes :company, :content_lead_form, :digital_assets
  permit_params :company_id, :content_lead_form_id, :title, :slug, :description, :material_type, :visibility,
                :gate_mode, :status, :expires_at

  scope :all
  scope('Pendentes') { |scope| scope.where(status: 'pending') }
  scope('Publicados') { |scope| scope.where(status: 'published') }
  scope('Rejeitados') { |scope| scope.where(status: 'rejected') }

  filter :company
  filter :status
  filter :gate_mode
  filter :material_type
  filter :created_at

  index do
    selectable_column
    id_column
    column :company
    column :title
    column :material_type
    column :gate_mode
    column :status
    column :download_count
    column :updated_at
    actions
  end

  member_action :approve, method: :put do
    unless resource.digital_assets.document.where(status: 'published', processing_status: 'ready').exists?
      redirect_to resource_path, alert: 'Aprove ao menos um PDF antes de publicar o material.' and return
    end
    resource.update!(status: 'published', published_at: Time.current, moderation_reason: nil)
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'approved')
    redirect_to resource_path, notice: 'Material publicado.'
  end

  member_action :reject, method: :put do
    reason = params[:reason].presence || 'Material não atende às políticas de publicação.'
    resource.update!(status: 'rejected', moderation_reason: reason)
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'rejected', reason: reason)
    redirect_to resource_path, alert: 'Material rejeitado.'
  end

  action_item :approve, only: :show, if: proc { resource.status == 'pending' } do
    link_to 'Aprovar e publicar', approve_admin_company_material_path(resource), method: :put
  end

  action_item :reject, only: :show, if: proc { resource.status.in?(%w[pending published]) } do
    link_to 'Rejeitar', reject_admin_company_material_path(resource), method: :put, data: { confirm: 'Rejeitar este material? O motivo padrão será registrado.' }
  end
end
