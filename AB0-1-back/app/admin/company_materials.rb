# frozen_string_literal: true

ActiveAdmin.register CompanyMaterial do
  menu false
  includes :company, :content_lead_form, :digital_assets
  permit_params :company_id, :content_lead_form_id, :title, :slug, :description, :material_type, :visibility,
                :gate_mode, :status, :expires_at

  scope :all
  scope('Rascunhos') { |scope| scope.where(status: 'draft') }
  scope('Pendentes') { |scope| scope.where(status: 'pending') }
  scope('Publicados') { |scope| scope.where(status: 'published') }
  scope('Rejeitados') { |scope| scope.where(status: 'rejected') }
  scope('Arquivados') { |scope| scope.where(status: 'archived') }

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
    column(:status) do |m|
      status_map = { 'draft' => 'Rascunho', 'pending' => 'Em análise', 'published' => 'Publicado', 'rejected' => 'Rejeitado', 'archived' => 'Arquivado' }
      status_tag(status_map[m.status] || m.status, class: m.status == 'published' ? 'ok' : (m.status == 'rejected' ? 'error' : 'warning'))
    end
    column :published_at
    column :download_count
    column :updated_at
    actions
  end

  show do
    attributes_table do
      row :id
      row :company
      row :title
      row :slug
      row :description
      row :material_type
      row :gate_mode
      row(:status) do |m|
        status_map = { 'draft' => 'Rascunho', 'pending' => 'Em análise', 'published' => 'Publicado', 'rejected' => 'Rejeitado', 'archived' => 'Arquivado' }
        status_tag(status_map[m.status] || m.status, class: m.status == 'published' ? 'ok' : (m.status == 'rejected' ? 'error' : 'warning'))
      end
      row :published_at
      row :expires_at
      row :download_count
      row :moderation_reason
      row :content_lead_form
      row :created_at
      row :updated_at
    end
  end

  form do |f|
    f.inputs do
      f.input :company
      f.input :content_lead_form
      f.input :title
      f.input :slug
      f.input :description
      f.input :material_type
      f.input :visibility
      f.input :gate_mode
      f.input :status,
               as: :select,
               collection: CompanyMaterial::STATUSES.reject { |status| status == 'published' }.map { |status| [
                 { 'draft' => 'Rascunho', 'pending' => 'Em análise', 'rejected' => 'Rejeitado', 'archived' => 'Arquivado' }[status],
                 status
               ] },
               include_blank: false,
               hint: "Para publicar um material em análise, utilize a ação 'Aprovar e publicar'."
      f.input :published_at, as: :string, input_html: { type: 'datetime-local', disabled: true, style: 'width: 320px; max-width: 100%;' }
      f.input :expires_at, as: :string, input_html: { type: 'datetime-local', style: 'width: 320px; max-width: 100%;' }
    end
    f.actions
  end

  controller do
    def update
      requested_status = params.dig(:company_material, :status)
      if requested_status == 'published' && resource.status != 'published'
        redirect_to resource_path, alert: "Para publicar, utilize a ação 'Aprovar e publicar'."
        return
      end

      super
    end
  end

  controller do
    private

    def redirect_to_material_destination(options = {})
      destination = params[:return_to].to_s
      destination = resource_path unless destination.start_with?('/admin/companies/')
      redirect_to destination, **options
    end
  end

  # Aprovar e publicar — usa ModerationService que delega para model.publish!
  member_action :approve, method: :put do
    CompanyMaterials::ModerationService.new(material: resource, admin_user: current_admin_user).approve!
    redirect_to_material_destination(notice: 'Material publicado.')
  rescue StandardError => e
    redirect_to_material_destination(alert: e.message)
  end

  member_action :reject, method: :put do
    reason = params[:reason].to_s.strip
    return redirect_to_material_destination(alert: 'Informe o motivo da rejeição.') if reason.blank?

    CompanyMaterials::ModerationService.new(material: resource, admin_user: current_admin_user).reject!(reason: reason)
    redirect_to_material_destination(alert: 'Material rejeitado.')
  rescue ArgumentError => e
    redirect_to_material_destination(alert: e.message)
  end

  member_action :request_changes, method: :put do
    reason = params[:reason].to_s.strip
    return redirect_to_material_destination(alert: 'Informe o ajuste solicitado.') if reason.blank?

    CompanyMaterials::ModerationService.new(material: resource, admin_user: current_admin_user).request_changes!(reason: reason)
    redirect_to_material_destination(notice: 'Ajustes solicitados à empresa.')
  rescue ArgumentError => e
    redirect_to_material_destination(alert: e.message)
  end

  # Enviar para análise (draft -> pending)
  member_action :submit_for_review, method: :put do
    unless resource.publishable?
      redirect_to_material_destination(alert: 'Anexe um PDF pronto antes de enviar para análise.')
      return
    end
    resource.update!(status: 'pending', moderation_reason: nil)
    redirect_to_material_destination(notice: 'Material enviado para análise.')
  rescue StandardError => e
    redirect_to_material_destination(alert: e.message)
  end

  # Arquivar
  member_action :archive, method: :put do
    resource.update!(status: 'archived')
    redirect_to_material_destination(notice: 'Material arquivado.')
  rescue StandardError => e
    redirect_to_material_destination(alert: e.message)
  end

  action_item :approve, only: %i[show edit], if: proc { resource.status == 'pending' } do
    link_to 'Aprovar e publicar', approve_admin_company_material_path(resource), method: :put
  end

  action_item :submit_for_review, only: %i[show edit], if: proc { resource.status == 'draft' } do
    link_to 'Enviar para análise', submit_for_review_admin_company_material_path(resource), method: :put
  end

  action_item :archive_material, only: %i[show edit], if: proc { resource.status.in?(%w[draft pending rejected]) } do
    link_to 'Arquivar', archive_admin_company_material_path(resource), method: :put, data: { confirm: 'Tem certeza?' }
  end

  action_item :company_360, only: %i[show edit] do
    link_to 'Voltar para Empresa 360', materials_admin_company_path(resource.company)
  end

  sidebar "Arquivos do material", only: :show do
    div class: "panel_contents" do
      pdfs = resource.digital_assets.document.where.not(status: "archived")
      ready_count = pdfs.where(processing_status: "ready").count
      para "PDFs totais: #{pdfs.count} | Prontos: #{ready_count}"
      para "Publicável: #{resource.publishable? ? 'Sim' : 'Não'}"

      if pdfs.any? && ready_count.zero?
        para "⚠️ Nenhum PDF terminou o processamento.", style: "color: #b91c1c;"
      end

      if resource.digital_assets.any?
        resource.digital_assets.each do |asset|
          para do
            label = asset.title.presence || (asset.file.attached? ? asset.file.filename.to_s : "Sem arquivo")
            asset.file.attached? ? link_to(label, url_for(asset.file), target: "_blank", rel: "noreferrer") : span(label)
          end
          para "Tipo: #{asset.kind} | Status: #{asset.status} | Processamento: #{asset.processing_status} | Anexado: #{asset.file.attached? ? 'Sim' : 'Não'}"
        end
      else
        para "Nenhum arquivo associado a este material."
      end
    end
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

