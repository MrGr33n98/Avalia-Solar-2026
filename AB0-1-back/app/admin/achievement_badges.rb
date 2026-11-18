# frozen_string_literal: true

ActiveAdmin.register AchievementBadge do
  menu parent: 'Gamificação', label: 'Catálogo de Conquistas', priority: 1

  permit_params :name, :slug, :category, :tier, :points_xp, :active, :action_enum,
                :threshold, :position, :description, :earned_asset_path, :locked_asset_path, :revocable

  filter :name
  filter :category, as: :select, collection: -> { AchievementBadge::CATEGORIES }
  filter :tier, as: :select, collection: -> { AchievementBadge::TIERS }
  filter :action_enum, as: :select, collection: -> { AchievementBadge::ACTIONS }
  filter :active
  filter :points_xp

  index do
    selectable_column
    id_column
    column :asset do |badge|
      if badge.earned_asset_path.present?
        image_tag "/assets/achievements/#{badge.earned_asset_path}", style: 'height: 40px; width: auto;'
      end
    end
    column :name
    column :slug
    column :category do |b|
      status_tag b.category
    end
    column :tier do |b|
      status_tag b.tier
    end
    column 'XP', :points_xp
    column 'Meta', :threshold
    column :active
    column 'Desbloqueios' do |badge|
      badge.user_achievements.unlocked.count
    end
    actions
  end

  show do
    attributes_table do
      row :id
      row :asset do |badge|
        if badge.earned_asset_path.present?
          image_tag "/assets/achievements/#{badge.earned_asset_path}", style: 'height: 80px; width: auto;'
        end
      end
      row :name
      row :slug
      row :category
      row :tier
      row 'XP', &:points_xp
      row :action_enum
      row :threshold
      row :position
      row :active
      row :revocable
      row :description
      row :earned_asset_path
      row :locked_asset_path
      row :created_at
      row :updated_at
    end

    panel 'Usuários com esta Conquista (Recentes)' do
      table_for achievement_badge.user_achievements.includes(:user).order(unlocked_at: :desc).limit(25) do
        column 'Usuário' do |ua|
          link_to ua.user.name, admin_user_path(ua.user)
        end
        column 'Status' do |ua|
          status_tag ua.state
        end
        column 'Desbloqueado em' do |ua|
          ua.unlocked_at&.strftime('%d/%m/%Y %H:%M')
        end
        column 'Token' do |ua|
          ua.share_token
        end
      end
    end
  end

  form do |f|
    f.semantic_errors
    f.inputs 'Detalhes da Conquista' do
      f.input :name
      f.input :slug
      f.input :category, as: :select, collection: AchievementBadge::CATEGORIES
      f.input :tier, as: :select, collection: AchievementBadge::TIERS
      f.input :points_xp, label: 'Pontos XP', as: :number
      f.input :action_enum, as: :select, collection: AchievementBadge::ACTIONS
      f.input :threshold, as: :number
      f.input :position, as: :number
      f.input :earned_asset_path
      f.input :locked_asset_path
      f.input :active
      f.input :revocable
      f.input :description, as: :text, input_html: { rows: 3 }
    end
    f.actions
  end
end
