ActiveAdmin.register ReviewerPublication do
  permit_params :title, :slug, :excerpt, :body, :status, :publication_type, :category, :comments_enabled, :lead_capture_enabled

  index do
    selectable_column
    id_column
    column :user
    column :title
    column :status
    column :category
    column :published_at
    column :created_at
    actions
  end

  member_action :publish, method: :post do
    resource.update!(status: 'published', published_at: Time.current)
    redirect_to resource_path(resource), notice: 'Publicação publicada.'
  end

  member_action :archive, method: :post do
    resource.update!(status: 'archived')
    redirect_to resource_path(resource), notice: 'Publicação arquivada.'
  end
end
