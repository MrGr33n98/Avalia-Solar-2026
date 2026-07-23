# frozen_string_literal: true

ActiveAdmin.register CompanyProject do
  includes :company, :digital_assets
  permit_params :company_id, :title, :slug, :summary, :project_type, :segment, :technology, :city, :state,
                :capacity_value, :capacity_unit, :completion_date, :status, :position

  scope :all
  scope('Pendentes') { |scope| scope.where(status: 'pending') }
  scope('Publicados') { |scope| scope.where(status: 'published') }
  scope('Rejeitados') { |scope| scope.where(status: 'rejected') }

  filter :company
  filter :status
  filter :project_type
  filter :segment
  filter :technology
  filter :created_at

  index do
    selectable_column
    id_column
    column :company
    column :title
    column :project_type
    column :city
    column :state
    column :status
    column('Ativos') { |project| project.digital_assets.count }
    column :updated_at
    actions
  end

  member_action :approve, method: :put do
    resource.publish!
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'approved')
    redirect_to resource_path, notice: 'Projeto publicado.'
  end

  member_action :reject, method: :put do
    reason = params[:reason].presence || 'Conteúdo não atende às políticas de publicação.'
    resource.update!(status: 'rejected', moderation_reason: reason)
    ContentModerationDecision.create!(company: resource.company, moderatable: resource, admin_user: current_admin_user, decision: 'rejected', reason: reason)
    redirect_to resource_path, alert: 'Projeto rejeitado.'
  end

  action_item :approve, only: :show, if: proc { resource.status == 'pending' } do
    link_to 'Aprovar e publicar', approve_admin_company_project_path(resource), method: :put
  end

  action_item :reject, only: :show, if: proc { resource.status.in?(%w[pending published]) } do
    link_to 'Rejeitar', reject_admin_company_project_path(resource), method: :put, data: { confirm: 'Rejeitar este projeto? O motivo padrão será registrado.' }
  end
end
