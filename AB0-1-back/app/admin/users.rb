ActiveAdmin.register User do
  menu false
  permit_params do
    permitted = [:email, :password, :password_confirmation, :name, :role, :company_id, :status, :rejection_reason, :terms_accepted,
                 { company_members_attributes: %i[id company_id role _destroy] }]
    permitted << :approved_by_admin if User.column_names.include?('approved_by_admin')
    permitted
  end

  # Define explicit filters without Post references
  filter :email
  filter :name
  filter :status, as: :select, collection: User.statuses
  filter :company
  filter :created_at
  filter :updated_at

  # Remove any filter that might be causing the issue
  remove_filter :posts

  scope :all
  scope('Pendentes', default: true) { |scope| scope.where(approved_by_admin: [false, nil]) }
  scope('Ativos') { |scope| scope.where(approved_by_admin: true, status: User.statuses[:active]) }
  scope('Rejeitados', &:rejected)

  member_action :approve, method: :put do
    resource.update(status: :active, approved_by_admin: true)

    unless ENV.fetch('SKIP_EMAILS_IN_ADMIN_APPROVE', 'false') == 'true'
      UserMailer.approval_email(resource).deliver_later
      # Envia instruções de confirmação se o usuário ainda não confirmou o e-mail
      # Isso é importante para usuários do tipo 'company' que têm o e-mail pulado no cadastro
      if resource.respond_to?(:send_confirmation_instructions) && !resource.confirmed?
        resource.send_confirmation_instructions
      end
    end
    redirect_to resource_path, notice: 'Usuário aprovado com sucesso!'
  end

  member_action :reject, method: :put do
    if params[:rejection_reason].blank?
      redirect_to resource_path, alert: 'Motivo da rejeição é obrigatório.'
      return
    end
    resource.update(status: :rejected, rejection_reason: params[:rejection_reason])

    unless ENV.fetch('SKIP_EMAILS_IN_ADMIN_APPROVE', 'false') == 'true'
      UserMailer.rejection_email(resource).deliver_later
    end
    redirect_to resource_path, notice: 'Usuário rejeitado.'
  end

  action_item :approve, only: :show do
    link_to 'Aprovar Usuário', approve_admin_user_path(resource), method: :put unless resource.approved_by_admin?
  end

  action_item :reject_modal, only: :show do
    if resource.pending? || resource.active?
      # Simple way to handle rejection reason input: Render a form or use a JS prompt (less robust).
      # For robustness, we will create a dedicated page or partial, but for now let's use a simple form in the show page sidebar or a custom page.
      # Using a link that opens a modal would be ideal, but ActiveAdmin standard is limited.
      # Let's add a sidebar form for rejection if status is pending.
    end
  end

  show do
    attributes_table do
      row :id
      row :name
      row :email
      row :role
      row :status do |user|
        status_tag user.status
      end
      row :approved_by_admin
      row :company
      row :created_at
      row :updated_at
    end

    panel 'Empresas Vinculadas' do
      table_for user.company_members do
        column :company
        column :role
        column :created_at
      end
    end

    active_admin_comments
  end

  sidebar 'Ações de Aprovação', only: :show, if: proc { !resource.approved_by_admin? } do
    div do
      button_to 'Aprovar Usuário', approve_admin_user_path(resource), method: :put, class: 'button'
    end
    br
    h4 'Rejeitar Usuário'
    form action: reject_admin_user_path(resource), method: :post do |_f|
      input name: '_method', type: 'hidden', value: 'put'
      input name: 'authenticity_token', type: 'hidden', value: form_authenticity_token
      textarea name: 'rejection_reason', placeholder: 'Motivo da rejeição', rows: 4,
               style: 'width: 100%; margin-bottom: 10px;'
      input type: 'submit', value: 'Rejeitar', class: 'button'
    end
  end

  index do
    selectable_column
    id_column
    column :email
    column :name
    column :role
    column :company
    column :status do |user|
      status_tag user.status
    end
    column :created_at
    actions defaults: true do |user|
      item 'Aprovar', approve_admin_user_path(user), method: :put, class: 'member_link' unless user.approved_by_admin?
    end
  end

  form do |f|
    f.semantic_errors
    f.inputs 'Informações Básicas' do
      f.input :email
      f.input :name
      f.input :role, as: :select, collection: %w[user admin company]
      f.input :status, as: :select, collection: User.statuses.keys
      f.input :approved_by_admin if User.column_names.include?('approved_by_admin')
      f.input :terms_accepted, as: :boolean, label: 'Termos aceitos'

      if f.object.new_record?
        f.input :password
        f.input :password_confirmation
      end
    end

    f.inputs 'Vínculos com Empresas' do
      f.has_many :company_members, allow_destroy: true, heading: false do |m|
        m.input :company, collection: Company.order(:name)
        m.input :role, as: :select, collection: CompanyMember.roles.keys
      end
    end

    f.actions
  end

  batch_action :aprovar, confirm: 'Aprovar usuários selecionados?' do |ids|
    users = batch_action_collection.where(id: ids)
    users.update_all(status: User.statuses[:active], approved_by_admin: true)

    # Send approval emails
    users.each do |user|
      UserMailer.approval_email(user).deliver_later if UserMailer.respond_to?(:approval_email)
    end

    redirect_to collection_path, notice: 'Usuários aprovados com sucesso.'
  end
end
