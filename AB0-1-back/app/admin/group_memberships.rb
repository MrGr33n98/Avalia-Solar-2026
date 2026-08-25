# frozen_string_literal: true

ActiveAdmin.register GroupMembership do
  menu label: 'Membros de comunidades', parent: 'Reviews', if: proc { Groups::Feature.enabled? }
  permit_params :notifications_level, :muted_until

  controller do
    before_action :ensure_groups_enabled!

    private

    def ensure_groups_enabled!
      return if Groups::Feature.enabled?

      redirect_to admin_root_path, alert: 'Comunidades ainda não estão habilitadas.'
    end
  end

  actions :index, :show, :edit, :update

  filter :group
  filter :user
  filter :role, as: :select, collection: GroupMembership::ROLES
  filter :status, as: :select, collection: GroupMembership::STATUSES

  index do
    selectable_column
    id_column
    column :group
    column :user
    column :role
    column :status
    column :joined_at
    column :approved_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :notifications_level, as: :select, collection: GroupMembership::NOTIFICATION_LEVELS
      f.input :muted_until
    end
    f.actions
  end
end
