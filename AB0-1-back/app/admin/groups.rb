# frozen_string_literal: true

ActiveAdmin.register Group do
  menu label: 'Comunidades', parent: 'Reviews', if: proc { Groups::Feature.enabled? }
  permit_params :name, :slug, :description, :short_description, :visibility, :membership_mode, :posting_mode, :category_id

  controller do
    before_action :ensure_groups_enabled!

    private

    def ensure_groups_enabled!
      return if Groups::Feature.enabled?

      redirect_to admin_root_path, alert: 'Comunidades ainda não estão habilitadas.'
    end
  end

  actions :index, :show, :new, :create, :edit, :update

  filter :name
  filter :status, as: :select, collection: Group::STATUSES
  filter :visibility, as: :select, collection: Group::VISIBILITIES
  filter :owner
  filter :official
  filter :featured
  filter :created_at

  index do
    selectable_column
    id_column
    column :name
    column :slug
    column :status
    column :visibility
    column :owner
    column :members_count
    column :official
    column :featured
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :name
      f.input :slug
      f.input :description
      f.input :short_description
      f.input :visibility, as: :select, collection: Group::VISIBILITIES
      f.input :membership_mode, as: :select, collection: Group::MEMBERSHIP_MODES
      f.input :posting_mode, as: :select, collection: Group::POSTING_MODES
      f.input :category
    end
    f.actions
  end
end
