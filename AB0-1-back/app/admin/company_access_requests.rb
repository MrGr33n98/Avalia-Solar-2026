ActiveAdmin.register CompanyAccessRequest do
  menu priority: 11, label: proc {
    pending_count = CompanyAccessRequest.pending.count
    if pending_count > 0
      "Solicitações de Acesso <span class='count'>#{pending_count}</span>".html_safe
    else
      "Solicitações de Acesso"
    end
  }
  actions :index, :show

  scope :all, default: true
  scope :pending
  scope :approved
  scope :rejected

  action_item :approve, only: :show, if: proc { resource.pending? } do
    link_to 'Approve', '#', class: 'member_link',
            onclick: "const note = prompt('Nota opcional para aprovação:'); window.location.href = '#{approve_admin_company_access_request_path(resource)}?note=' + encodeURIComponent(note || ''); return false;"
  end

  action_item :reject, only: :show, if: proc { resource.pending? } do
    link_to 'Reject', '#', class: 'member_link',
            onclick: "const reason = prompt('Motivo da rejeição (obrigatório):'); if(reason) { window.location.href = '#{reject_admin_company_access_request_path(resource)}?reason=' + encodeURIComponent(reason); } return false;"
  end

  member_action :approve, method: :put do
    if resource.approved?
      redirect_to resource_path, notice: 'Solicitação já aprovada.' and return
    end

    resource.transaction do
      resource.update!(
        status: 'approved',
        admin_note: params[:note].presence,
        reviewed_at: Time.current,
        reviewed_by_admin_user_id: current_admin_user.id
      )

      member = CompanyMember.find_or_initialize_by(user: resource.user, company: resource.company)
      member.role = 'manager' if member.respond_to?(:role)
      member.status = 'active' if member.respond_to?(:status)
      member.save!
    end

    CompanyAccessMailer.access_granted(resource.user, resource.company).deliver_later
    redirect_to resource_path, notice: 'Acesso aprovado e email enviado.'
  rescue StandardError => e
    Rails.logger.error("[Admin::CompanyAccessRequest] approve failed id=#{resource.id} error=#{e.class} #{e.message}")
    redirect_to resource_path, alert: 'Falha ao aprovar solicitação.'
  end

  member_action :reject, method: :put do
    if resource.rejected?
      redirect_to resource_path, notice: 'Solicitação já rejeitada.' and return
    end

    reason = params[:reason].presence || 'Motivo não informado'
    resource.update!(
      status: 'rejected',
      admin_note: reason,
      reviewed_at: Time.current,
      reviewed_by_admin_user_id: current_admin_user.id
    )

    CompanyAccessMailer.access_rejected(resource.user, resource.company, reason).deliver_later
    redirect_to resource_path, notice: 'Solicitação rejeitada e email enviado.'
  rescue StandardError => e
    Rails.logger.error("[Admin::CompanyAccessRequest] reject failed id=#{resource.id} error=#{e.class} #{e.message}")
    redirect_to resource_path, alert: 'Falha ao rejeitar solicitaÃ§Ã£o.'
  end

  index do
    selectable_column
    id_column
    column :user
    column :company
    column :status do |request|
      status_tag request.status
    end
    column :requested_at
    column :reviewed_at
    column :reviewed_by_admin_user
    actions
  end

  show do
    attributes_table do
      row :user
      row :company
      row :status
      row :message
      row :admin_note
      row :requested_at
      row :reviewed_at
      row :reviewed_by_admin_user
      row :created_at
      row :updated_at
    end
  end

  filter :user
  filter :company
  filter :status
  filter :requested_at
  filter :reviewed_at
end
