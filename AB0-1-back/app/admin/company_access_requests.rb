ActiveAdmin.register CompanyAccessRequest do
  menu priority: 11, label: proc {
    pending_count = CompanyAccessRequest.pending.count
    if pending_count > 0
      "Solicitacoes de Acesso <span class='count'>#{pending_count}</span>".html_safe
    else
      'Solicitacoes de Acesso'
    end
  }
  actions :index, :show

  scope :all, default: true
  scope :pending
  scope :approved
  scope :rejected

  build_member_action_form_js = lambda do |path:, prompt_label:, param_name:, required: false|
    <<~JS.squish
      const value = prompt('#{prompt_label}');
      if (#{required} && (!value || value.trim().length === 0)) { return false; }

      const form = document.createElement('form');
      form.method = 'post';
      form.action = '#{path}';

      const methodInput = document.createElement('input');
      methodInput.type = 'hidden';
      methodInput.name = '_method';
      methodInput.value = 'put';
      form.appendChild(methodInput);

      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      if (csrfMeta && csrfMeta.content) {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'authenticity_token';
        csrfInput.value = csrfMeta.content;
        form.appendChild(csrfInput);
      }

      const valueInput = document.createElement('input');
      valueInput.type = 'hidden';
      valueInput.name = '#{param_name}';
      valueInput.value = value || '';
      form.appendChild(valueInput);

      document.body.appendChild(form);
      form.submit();
      return false;
    JS
  end

  action_item :approve, only: :show, if: proc { resource.pending? } do
    link_to 'Approve', '#', class: 'member_link',
            onclick: build_member_action_form_js.call(
              path: approve_admin_company_access_request_path(resource),
              prompt_label: 'Nota opcional para aprovacao:',
              param_name: 'note'
            )
  end

  action_item :reject, only: :show, if: proc { resource.pending? } do
    link_to 'Reject', '#', class: 'member_link',
            onclick: build_member_action_form_js.call(
              path: reject_admin_company_access_request_path(resource),
              prompt_label: 'Motivo da rejeicao (obrigatorio):',
              param_name: 'reason',
              required: true
            )
  end

  member_action :approve, method: :put do
    if resource.approved?
      redirect_to resource_path, notice: 'Solicitacao ja aprovada.' and return
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
    redirect_to resource_path, alert: 'Falha ao aprovar solicitacao.'
  end

  member_action :reject, method: :put do
    if resource.rejected?
      redirect_to resource_path, notice: 'Solicitacao ja rejeitada.' and return
    end

    reason = params[:reason].presence || 'Motivo nao informado'
    resource.update!(
      status: 'rejected',
      admin_note: reason,
      reviewed_at: Time.current,
      reviewed_by_admin_user_id: current_admin_user.id
    )

    CompanyAccessMailer.access_rejected(resource.user, resource.company, reason).deliver_later
    redirect_to resource_path, notice: 'Solicitacao rejeitada e email enviado.'
  rescue StandardError => e
    Rails.logger.error("[Admin::CompanyAccessRequest] reject failed id=#{resource.id} error=#{e.class} #{e.message}")
    redirect_to resource_path, alert: 'Falha ao rejeitar solicitacao.'
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
