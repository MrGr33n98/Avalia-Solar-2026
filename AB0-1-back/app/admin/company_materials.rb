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
    reason = params[:reason].to_s.strip
    return redirect_to(resource_path, alert: 'Informe o motivo da rejeição.') if reason.blank?

    resource.update!(status: 'rejected', published_at: nil, moderation_reason: reason)
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'rejected', reason: reason)
    redirect_to resource_path, alert: 'Material rejeitado.'
  end

  member_action :request_changes, method: :put do
    reason = params[:reason].to_s.strip
    return redirect_to(resource_path, alert: 'Informe o ajuste solicitado.') if reason.blank?

    resource.update!(status: 'draft', moderation_reason: reason)
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'changes_requested', reason: reason)
    redirect_to resource_path, notice: 'Ajustes solicitados à empresa.'
  end

  action_item :approve, only: :show, if: proc { resource.status == 'pending' } do
    link_to 'Aprovar e publicar', approve_admin_company_material_path(resource), method: :put
  end

  sidebar 'Decisão de moderação', only: :show, if: proc { resource.status.in?(%w[pending published]) } do
    div class: 'panel_contents' do
      para 'Informe um motivo antes de rejeitar ou solicitar ajustes. A decisão ficará no histórico da empresa.'
      form action: reject_admin_company_material_path(resource), method: :post do
        input type: :hidden, name: :_method, value: :put
        textarea name: :reason, required: true, placeholder: 'Motivo da rejeição', rows: 4
        input type: :submit, value: 'Rejeitar material'
      end
      if resource.status == 'pending'
        form action: request_changes_admin_company_material_path(resource), method: :post do
          input type: :hidden, name: :_method, value: :put
          textarea name: :reason, required: true, placeholder: 'Ajustes solicitados', rows: 4
          input type: :submit, value: 'Solicitar ajustes'
        end
      end
    end
  end
end
