# frozen_string_literal: true

ActiveAdmin.register AchievementLedger do
  menu parent: 'Gamificação', label: 'Auditoria & Ledger', priority: 3

  # Ledger imutável pelo backoffice: somente leitura (sem criação, edição ou exclusão).
  actions :index, :show
  config.batch_actions = false

  filter :user, as: :select, collection: -> { User.where(role: 'review').order(:name).limit(100).pluck(:name, :id) }
  filter :achievement_badge, as: :select, collection: -> { AchievementBadge.order(:name) }
  filter :admin_user, as: :select, collection: -> { AdminUser.order(:email).pluck(:email, :id) }
  filter :kind, as: :select, collection: -> { AchievementLedger::KINDS }
  filter :xp_delta
  filter :reason
  filter :idempotency_key
  filter :created_at

  controller do
    def scoped_collection
      super.includes(:user, :achievement_badge, :admin_user)
    end
  end

  index do
    id_column
    column('Usuário') { |l| auto_link(l.user, l.user.name.presence || l.user.email) }
    column('Conquista') { |l| auto_link(l.achievement_badge, l.achievement_badge.name) }
    column 'Evento' do |l|
      status_tag l.kind
    end
    column 'Delta de XP', sortable: :xp_delta do |l|
      l.xp_delta.positive? ? "+#{l.xp_delta}" : l.xp_delta.to_s
    end
    column('Administrador') { |l| l.admin_user&.email || 'Sistema' }
    column('Justificativa') { |l| l.reason.to_s.truncate(80) }
    column 'Data / Hora', :created_at
    actions
  end

  show do
    attributes_table do
      row :id
      row('Usuário') { |l| auto_link(l.user, l.user.name.presence || l.user.email) }
      row('Conquista') { |l| auto_link(l.achievement_badge, l.achievement_badge.name) }
      row :kind
      row :xp_delta
      row('Administrador') { |l| l.admin_user&.email || 'Sistema' }
      row :reason
      row :idempotency_key
      row :created_at
    end
  end
end
