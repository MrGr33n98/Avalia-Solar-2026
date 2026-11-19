# frozen_string_literal: true

ActiveAdmin.register UserAchievement do
  menu parent: 'Gamificação', label: 'Conquistas de Usuários', priority: 2

  # Histórico de conquistas não sofre exclusão física: revogações são transições
  # de estado auditadas no ledger (ver Gamification::AdminAchievementService).
  actions :index, :show
  config.batch_actions = false

  filter :user, as: :select, collection: -> { User.where(role: 'review').order(:name).limit(100).pluck(:name, :id) }
  filter :achievement_badge, as: :select, collection: -> { AchievementBadge.order(:name) }
  filter :state, as: :select, collection: UserAchievement::STATES
  filter :unlocked_at
  filter :share_token

  scope :all, default: true
  scope('Desbloqueados', &:unlocked)
  scope('Revogados', &:revoked)

  controller do
    def scoped_collection
      super.includes(:user, :achievement_badge).references(:user, :achievement_badge)
    end

    private

    def achievement_service
      Gamification::AdminAchievementService.new(admin_user: current_admin_user)
    end

    def redirect_with_result(path, result, success_message)
      if result.applied?
        redirect_to path, notice: success_message
      elsif result.noop?
        redirect_to path, notice: 'Nenhuma alteração aplicada: a conquista já estava no estado solicitado.'
      else
        redirect_to path, flash: { error: result.error }
      end
    end
  end

  member_action :revoke, method: :post do
    result = achievement_service.revoke(resource, reason: params[:justification])
    redirect_with_result(admin_user_achievement_path(resource), result,
                         'Conquista revogada com sucesso e registrada no livro-razão.')
  end

  member_action :reinstate, method: :post do
    result = achievement_service.reinstate(resource, reason: params[:justification])
    redirect_with_result(admin_user_achievement_path(resource), result,
                         'Conquista restabelecida com sucesso e registrada no livro-razão.')
  end

  collection_action :manual_grant, method: :post do
    user = User.find_by(id: params[:user_id])
    badge = AchievementBadge.find_by(id: params[:badge_id])
    result = achievement_service.grant(user: user, badge: badge, reason: params[:justification])
    message = "Conquista #{badge&.name} concedida manualmente para #{user&.name}." if result.applied?
    redirect_with_result(admin_user_achievements_path, result, message)
  end

  justification_onclick = lambda do |path, label|
    <<~JS
      var reason = prompt('Informe a justificativa obrigatória para #{label} (mínimo 20 caracteres):');
      if (reason && reason.trim().length >= 20) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = '#{path}';
        var csrf = document.querySelector('meta[name=csrf-token]');
        if (csrf) {
          var inputCsrf = document.createElement('input');
          inputCsrf.type = 'hidden';
          inputCsrf.name = 'authenticity_token';
          inputCsrf.value = csrf.content;
          form.appendChild(inputCsrf);
        }
        var inputReason = document.createElement('input');
        inputReason.type = 'hidden';
        inputReason.name = 'justification';
        inputReason.value = reason;
        form.appendChild(inputReason);
        document.body.appendChild(form);
        form.submit();
      } else if (reason) {
        alert('A justificativa deve ter no mínimo 20 caracteres.');
      }
      return false;
    JS
  end

  action_item :revoke, only: :show, if: -> { resource.unlocked? } do
    link_to 'Revogar Conquista', '#', class: 'button',
                                      onclick: justification_onclick.call(revoke_admin_user_achievement_path(resource),
                                                                          'revogar')
  end

  action_item :reinstate, only: :show, if: -> { resource.revoked? } do
    link_to 'Restabelecer Conquista', '#', class: 'button',
                                           onclick: justification_onclick.call(
                                             reinstate_admin_user_achievement_path(resource), 'restabelecer'
                                           )
  end

  index do
    id_column
    column 'Usuário', sortable: 'users.name' do |ua|
      auto_link(ua.user, ua.user.name.presence || ua.user.email)
    end
    column 'Conquista', sortable: 'achievement_badges.name' do |ua|
      auto_link(ua.achievement_badge, ua.achievement_badge.name)
    end
    column 'Status' do |ua|
      status_tag ua.state, class: ua.unlocked? ? 'yes' : 'no'
    end
    column 'XP' do |ua|
      "+#{ua.achievement_badge.points_xp}"
    end
    column :unlocked_at
    column :revoked_at
    column 'Link de Verificação' do |ua|
      link_to 'Verificar', "/conquistas/verificar/#{ua.share_token}", target: '_blank' if ua.share_token.present?
    end
    actions
  end

  show do
    attributes_table do
      row :id
      row('Usuário') { |ua| auto_link(ua.user, ua.user.name.presence || ua.user.email) }
      row('Conquista') { |ua| auto_link(ua.achievement_badge, ua.achievement_badge.name) }
      row :state do |ua|
        status_tag ua.state
      end
      row :unlocked_at
      row :revoked_at
      row :share_token
      row 'URL Pública de Verificação' do |ua|
        if ua.share_token.present?
          link_to "/conquistas/verificar/#{ua.share_token}", "/conquistas/verificar/#{ua.share_token}",
                  target: '_blank'
        end
      end
      row :created_at
      row :updated_at
    end

    panel 'Histórico de Auditoria no Livro-Razão' do
      ledgers = AchievementLedger.includes(:admin_user)
                                 .where(user_id: resource.user_id, achievement_badge_id: resource.achievement_badge_id)
                                 .order(created_at: :desc)
      table_for ledgers do
        column 'Evento', :kind
        column 'XP', :xp_delta
        column('Administrador') { |ledger| ledger.admin_user&.email || 'Sistema' }
        column 'Justificativa', :reason
        column 'Data', :created_at
      end
    end
  end
end
