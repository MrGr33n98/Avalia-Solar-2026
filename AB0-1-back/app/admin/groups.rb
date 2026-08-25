# frozen_string_literal: true

ActiveAdmin.register Group do
  menu label: 'Comunidades', parent: 'Reviews', if: proc { Groups::Feature.enabled? }
  permit_params :name, :slug, :description, :short_description, :visibility, :membership_mode, :posting_mode, :category_id, :status, :official, :verified, :featured, :avatar, hero_images: []

  controller do
    before_action :ensure_groups_enabled!

    private

    def ensure_groups_enabled!
      return if Groups::Feature.enabled?

      redirect_to admin_root_path, alert: 'Comunidades ainda não estão habilitadas.'
    end
  end

  member_action :delete_avatar, method: :delete do
    group = Group.find(params[:id])
    group.avatar.purge
    redirect_to edit_admin_group_path(group), notice: 'Avatar removido com sucesso.'
  end

  member_action :delete_hero_image, method: :delete do
    group = Group.find(params[:id])
    attachment = group.hero_images.find_by(id: params[:attachment_id])
    attachment&.purge
    redirect_to edit_admin_group_path(group), notice: 'Capa removida com sucesso.'
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
    column :avatar do |g|
      if g.avatar.attached?
        image_tag g.avatar_url, style: 'max-width: 40px; max-height: 40px; border-radius: 4px; object-fit: cover;'
      end
    end
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

  show do
    attributes_table do
      row :id
      row :name
      row :slug
      row :description
      row :short_description
      row :status
      row :visibility
      row :owner
      row :members_count
      row :official
      row :featured
      row :created_at
      row :avatar do |g|
        if g.avatar.attached?
          image_tag g.avatar_url, style: 'max-width: 150px; border-radius: 8px;'
        else
          'Nenhum'
        end
      end
      row :hero_images do |g|
        if g.hero_images.attached?
          div do
            g.hero_images.each do |img|
              url = Rails.application.routes.url_helpers.rails_storage_proxy_url(img, only_path: true)
              span do
                image_tag url, style: 'max-height: 120px; margin-right: 10px; margin-bottom: 10px; border-radius: 4px;'
              end
            end
          end
        else
          'Nenhuma'
        end
      end
    end
    active_admin_comments
  end

  form do |f|
    f.inputs 'Informações Gerais' do
      f.input :name
      f.input :slug
      f.input :description
      f.input :short_description
      f.input :status, as: :select, collection: [['Rascunho (Draft)', 'draft'], ['Publicado (Active)', 'active'], ['Arquivado (Archived)', 'archived'], ['Suspenso (Suspended)', 'suspended']], include_blank: false
      f.input :visibility, as: :select, collection: Group::VISIBILITIES, include_blank: false
      f.input :membership_mode, as: :select, collection: Group::MEMBERSHIP_MODES, include_blank: false
      f.input :posting_mode, as: :select, collection: Group::POSTING_MODES, include_blank: false
      f.input :category
      f.input :official
      f.input :verified
      f.input :featured
    end

    f.inputs 'Identidade Visual (Mídias)' do
      if f.object.avatar.attached?
        f.input :avatar, as: :file, hint: f.template.image_tag(f.object.avatar_url, style: 'max-width: 100px; display: block; margin-bottom: 10px; border-radius: 8px;') +
                                          f.template.link_to('Remover Avatar', delete_avatar_admin_group_path(f.object), method: :delete, data: { confirm: 'Tem certeza?' }, class: 'button button-danger')
      else
        f.input :avatar, as: :file, hint: 'Envie um avatar quadrado (1:1), recomendado 512x512px, máximo 2MB.'
      end

      if f.object.hero_images.attached?
        hints_html = f.object.hero_images.map do |img|
          url = Rails.application.routes.url_helpers.rails_storage_proxy_url(img, only_path: true)
          f.template.content_tag(:div, style: 'display: inline-block; margin-right: 15px; margin-bottom: 15px; vertical-align: top; text-align: center;') do
            f.template.image_tag(url, style: 'max-height: 100px; display: block; margin-bottom: 5px; border-radius: 4px;') +
            f.template.link_to('Remover Capa', delete_hero_image_admin_group_path(f.object, attachment_id: img.id), method: :delete, data: { confirm: 'Tem certeza?' }, class: 'button button-danger', style: 'font-size: 11px; padding: 2px 6px;')
          end
        end.join.html_safe

        f.input :hero_images, as: :file, input_html: { multiple: true, accept: 'image/png,image/jpeg,image/webp' }, hint: f.template.content_tag(:div, hints_html) + f.template.content_tag(:p, 'Adicione mais capas (16:5, recomendado 1920x600px, máximo 5MB por capa, limite total 5).', style: 'margin-top: 10px;')
      else
        f.input :hero_images, as: :file, input_html: { multiple: true, accept: 'image/png,image/jpeg,image/webp' }, hint: 'Envie capas (16:5, recomendado 1920x600px, máximo 5MB por capa, limite total 5).'
      end
    end

    f.actions
  end
end
