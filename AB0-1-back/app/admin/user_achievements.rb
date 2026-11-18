# frozen_string_literal: true

ActiveAdmin.register UserAchievement do
  menu parent: 'Gamificação', label: 'Conquistas de Usuários', priority: 2

  actions :index, :show, :destroy

  filter :user, as: :select, collection: -> { User.where(role: 'review').order(:name).limit(100) }
  filter :achievement_badge, as: :select, collection: -> { AchievementBadge.order(:name) }
  filter :state, as: :select, collection: UserAchievement::STATES
  filter :unlocked_at
  filter :share_token

  scope :todos, default: true
  scope :desbloqueados, -> { unlocked }
  scope :revogados, -> { revoked }

  member_action :revoke, method: :post do
    user_achievement = resource
    reason = params[:justification].to_s.strip

    if reason.length < 20
      flash[:error] = 'A justificativa de revogação deve conter no mínimo 20 caracteres.'
      return redirect_to admin_user_achievement_path(user_achievement)
    end

    ActiveRecord::Base.transaction do
      user_achievement.revoke!
      AchievementLedger.create!(
        user: user_achievement.user,
        achievement_badge: user_achievement.achievement_badge,
        kind: 'manual_revoke',
        points_delta: -user_achievement.achievement_badge.points_xp,
        metadata: {
          admin_user_id: current_admin_user.id,
          admin_email: current_admin_user.email,
          reason: reason
        }
      )
    end

    redirect_to admin_user_achievement_path(user_achievement), notice: 'Conquista revogada com sucesso e registrada no livro-razão.'
  end

  member_action :reinstate, method: :post do
    user_achievement = resource

    ActiveRecord::Base.transaction do
      user_achievement.reinstate!
      AchievementLedger.create!(
        user: user_achievement.user,
        achievement_badge: user_achievement.achievement_badge,
        kind: 'reinstated',
        points_delta: user_achievement.achievement_badge.points_xp,
        metadata: {
          admin_user_id: current_admin_user.id,
          admin_email: current_admin_user.email,
          reason: 'Restabelecida administrativamente'
        }
      )
    end

    redirect_to admin_user_achievement_path(user_achievement), notice: 'Conquista restabelecida com sucesso.'
  end

  collection_action :manual_grant, method: :post do
    user = User.find_by(id: params[:user_id])
    badge = AchievementBadge.find_by(id: params[:badge_id])
    reason = params[:justification].to_s.strip

    if user.nil? || badge.nil?
      flash[:error] = 'Usuário ou Conquista inválida.'
      return redirect_to admin_user_achievements_path
    end

    if reason.length < 20
      flash[:error] = 'A justificativa de concessão manual deve conter no mínimo 20 caracteres.'
      return redirect_to admin_user_achievements_path
    end

    ActiveRecord::Base.transaction do
      ua = UserAchievement.find_or_initialize_by(user: user, achievement_badge: badge)
      ua.state = 'unlocked'
      ua.unlocked_at ||= Time.current
      ua.revoked_at = nil
      ua.save!

      AchievementLedger.create!(
        user: user,
        achievement_badge: badge,
        kind: 'manual_grant',
        points_delta: badge.points_xp,
        metadata: {
          admin_user_id: current_admin_user.id,
          admin_email: current_admin_user.email,
          reason: reason
        }
      )
    end

    redirect_to admin_user_achievements_path, notice: "Conquista #{badge.name} concedida manualmente para #{user.name}."
  end

  action_item :revoke, only: :show, if: -> { resource.unlocked? } do
    link_to 'Revogar Conquista', '#', class: 'button', onclick: "
      var reason = prompt('Informe a justificativa obrigatória para revogar (mínimo 20 caracteres):');
      if (reason && reason.length >= 20) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = '#{revoke_admin_user_achievement_path(resource)}';
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
    "
  end

  action_item :reinstate, only: :show, if: -> { resource.revoked? } do
    link_to 'Restabelecer Conquista', reinstate_admin_user_achievement_path(resource), method: :post, data: { confirm: 'Deseja restabelecer esta conquista?' }
  end

  index do
    selectable_column
    id_column
    column 'Usuário', :user, sortable: 'users.name'
    column 'Conquista', :achievement_badge, sortable: 'achievement_badges.name'
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
      row :user
      row :achievement_badge
      row :state do |ua|
        status_tag ua.state
      end
      row :unlocked_at
      row :revoked_at
      row :share_token
      row 'URL Pública de Verificação' do |ua|
        if ua.share_token.present?
          link_to "/conquistas/verificar/#{ua.share_token}", "/conquistas/verificar/#{ua.share_token}", target: '_blank'
        end
      end
      row :created_at
      row :updated_at
    end

    panel 'Histórico de Auditoria no Livro-Razão' do
      table_for AchievementLedger.where(user: user_achievement.user, achievement_badge: user_achievement.achievement_badge).order(created_at: :desc) do
        column 'Evento', :kind
        column 'Pontos (XP)', :points_delta
        column 'Data', :created_at
        column 'Metadados / Justificativa' do |ledger|
          ledger.metadata.to_json
        end
      end
    end
  end
end
