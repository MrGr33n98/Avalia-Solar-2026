ActiveAdmin.register Banner do
  permit_params :title, :image, :category_id, :company_id, :link, :active, :sponsored, :banner_type, :position, :start_date, :end_date, :moderation_status, :priority, :rejected_reason

  index do
    selectable_column
    id_column
    column :title
    column :image do |banner|
      image_tag url_for(banner.image), style: 'max-height: 100px' if banner.image.attached?
    end
    column :company
    column :moderation_status
    column :banner_type
    column :position
    column :start_date
    column :end_date
    column :active
    column :sponsored
    column :category
    column :link
    column :created_at
    actions
  end

  form do |f|
    f.inputs 'Detalhes do Banner' do
      f.input :title
      f.input :image, as: :file,
                      hint: f.object.image.attached? ? image_tag(url_for(f.object.image), style: 'max-height: 100px') : 'Arraste e solte a imagem aqui ou clique para selecionar',
                      input_html: {
                        direct_upload: true,
                        accept: 'image/*'
                      }
      f.input :banner_type, as: :select, collection: [
        ['Retangular Grande', 'rectangular_large'],
        ['Retangular Pequeno', 'rectangular_small']
      ]
      f.input :position, as: :select, collection: [
        %w[Navbar navbar],
        %w[Sidebar sidebar],
        ['Topo Categorias', 'categories_top']
      ]
      f.input :company
      f.input :moderation_status, as: :select, collection: Banner::MODERATION_STATUSES, include_blank: false if Banner.const_defined?(:MODERATION_STATUSES)
      f.input :priority
      f.input :category
      f.input :link
      f.input :start_date, as: :datetime_select
      f.input :end_date, as: :datetime_select
      f.input :active
      f.input :sponsored
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :title
      row :image do |banner|
        image_tag url_for(banner.image), style: 'max-height: 300px' if banner.image.attached?
      end
      row :company
      row :moderation_status
      row :approved_by_admin_user
      row :approved_at
      row :rejected_reason
      row :banner_type
      row :position
      row :start_date
      row :end_date
      row :category
      row :link
      row :active
      row :sponsored
      row :created_at
      row :updated_at
    end
  end
  # Defina filtros apenas para atributos simples
  filter :title
  filter :company
  filter :moderation_status
  filter :banner_type
  filter :position
  filter :category
  filter :link
  filter :active
  filter :sponsored
  filter :start_date
  filter :end_date
  filter :created_at

  action_item :approve, only: :show do
    if resource.respond_to?(:moderation_status) && resource.moderation_status == 'submitted'
      link_to 'Aprovar Banner', approve_admin_banner_path(resource), method: :put
    end
  end

  action_item :reject, only: :show do
    if resource.respond_to?(:moderation_status) && resource.moderation_status == 'submitted'
      link_to 'Rejeitar Banner', reject_admin_banner_path(resource), method: :put
    end
  end

  member_action :approve, method: :put do
    resource.approve!(current_admin_user)
    redirect_to resource_path(resource), notice: 'Banner aprovado.'
  end

  member_action :reject, method: :put do
    reason = params[:reason].presence || 'Reprovado na moderação'
    resource.reject!(current_admin_user, reason)
    redirect_to resource_path(resource), notice: 'Banner rejeitado.'
  end
end
