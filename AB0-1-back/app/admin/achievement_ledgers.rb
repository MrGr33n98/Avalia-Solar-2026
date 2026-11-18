# frozen_string_literal: true

ActiveAdmin.register AchievementLedger do
  menu parent: 'Gamificação', label: 'Auditoria & Ledger', priority: 3

  actions :index, :show

  filter :user, as: :select, collection: -> { User.where(role: 'review').order(:name).limit(100) }
  filter :achievement_badge, as: :select, collection: -> { AchievementBadge.order(:name) }
  filter :kind, as: :select, collection: -> { AchievementLedger::KINDS }
  filter :points_delta
  filter :created_at

  index do
    id_column
    column 'Usuário', :user
    column 'Conquista', :achievement_badge
    column 'Evento' do |l|
      status_tag l.kind
    end
    column 'Delta de Pontos (XP)' do |l|
      l.points_delta.positive? ? "+#{l.points_delta}" : l.points_delta.to_s
    end
    column 'Data / Hora', :created_at
    column 'Justificativa / Metadados' do |l|
      if l.metadata.is_a?(Hash) && l.metadata['reason'].present?
        l.metadata['reason'].to_s.truncate(80)
      else
        l.metadata.to_s.truncate(80)
      end
    end
    actions
  end

  show do
    attributes_table do
      row :id
      row :user
      row :achievement_badge
      row :kind
      row :points_delta
      row :metadata do |l|
        pre JSON.pretty_generate(l.metadata || {})
      end
      row :created_at
    end
  end
end
