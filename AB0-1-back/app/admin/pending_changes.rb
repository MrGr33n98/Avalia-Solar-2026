# app/admin/pending_changes.rb
ActiveAdmin.register PendingChange do
  permit_params :status, :rejection_reason, :approved_by_id
  menu priority: 5, label: 'Alterações Pendentes'

  scope :all, default: true
  scope :pending
  scope :approved
  scope :rejected

  filter :company
  filter :change_type, as: :select, collection: PendingChange::CHANGE_TYPES
  filter :status, as: :select, collection: %w[pending approved rejected]
  filter :created_at

  index do
    selectable_column
    id_column
    column :company
    column :change_type do |pc|
      status_tag pc.change_type.humanize
    end
    column :status do |pc|
      case pc.status
      when 'pending'
        status_tag 'Pendente', class: 'warning'
      when 'approved'
        status_tag 'Aprovado', class: 'ok'
      when 'rejected'
        status_tag 'Rejeitado', class: 'error'
      end
    end
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :id
      row :company
      row :user
      row :change_type do |pc|
        pc.change_type.humanize
      end
      row :status
      row :data do |pc|
        pre JSON.pretty_generate(pc.data)
      end
      row :rejection_reason
      row :approved_by
      row :approved_at
      row :rejected_at
      row :applied_at
      row :created_at
      row :updated_at
    end

    panel 'Visualização das Mudanças' do
      case pending_change.change_type
      when 'company_info'
        div class: 'company-info-preview' do
          h3 'Alterações de Informações'
          table_for [pending_change] do
            pending_change.data['attributes'].each do |field, new_value|
              tr do
                td strong field.humanize
                td do
                  div do
                    span 'Atual: '
                    span pending_change.data['previous_values'][field] || '-', style: 'color: #999'
                  end
                  div do
                    span 'Novo: '
                    span new_value, style: 'color: #0a0; font-weight: bold'
                  end
                end
              end
            end
          end
        end
      when 'categories'
        div class: 'categories-preview' do
          h3 "Ação: #{pending_change.data['action'].humanize}"
          ul do
            pending_change.data['category_ids'].each do |cat_id|
              li Category.find(cat_id).name rescue "Categoria ##{cat_id}"
            end
          end
        end
      end
    end

    panel 'Ações' do
      if pending_change.status == 'pending'
        div do
          button_to 'Aprovar Alteração', approve_admin_pending_change_path(pending_change), 
                    method: :post, class: 'button', form: { style: 'display:inline-block' }
        end
        div style: 'margin-top: 10px' do
          active_admin_form_for pending_change, url: reject_admin_pending_change_path(pending_change), method: :post do |f|
            f.inputs do
              f.input :rejection_reason, as: :text, input_html: { placeholder: 'Motivo da rejeição...' }
            end
            f.actions do
              f.action :submit, label: 'Rejeitar Alteração'
            end
          end
        end
      else
        div class: 'flash flash_notice' do
          "Esta alteração já foi #{pending_change.status == 'approved' ? 'aprovada' : 'rejeitada'}."
        end
      end
    end
  end

  member_action :approve, method: :post do
    resource.update!(
      status: 'approved',
      approved_by: current_admin_user,
      approved_at: Time.current
    )
    resource.apply_changes!
    
    redirect_to admin_pending_change_path(resource), 
                notice: 'Alteração aprovada e aplicada com sucesso!'
  end

  member_action :reject, method: :post do
    rp = params.require(:pending_change).permit(:rejection_reason)
    resource.update!(
      status: 'rejected',
      rejected_at: Time.current,
      rejection_reason: rp[:rejection_reason]
    )
    redirect_to admin_pending_change_path(resource), notice: 'Alteração rejeitada.'
  end

  batch_action :approve do |ids|
    batch_action_collection.find(ids).each do |pending_change|
      pending_change.update!(
        status: 'approved',
        approved_by: current_admin_user,
        approved_at: Time.current
      )
      pending_change.apply_changes!
    end
    redirect_to collection_path, notice: "#{ids.count} alterações aprovadas!"
  end

  batch_action :reject do |ids|
    batch_action_collection.find(ids).each do |pending_change|
      pending_change.update!(
        status: 'rejected',
        rejected_at: Time.current
      )
    end
    redirect_to collection_path, notice: "#{ids.count} alterações rejeitadas!"
  end

  controller do
    rescue_from ActionController::InvalidAuthenticityToken do
      redirect_to admin_pending_changes_path, alert: 'Sessão expirada. Tente novamente.'
    end
  end
end
