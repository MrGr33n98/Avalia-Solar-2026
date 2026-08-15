ActiveAdmin.register ReviewerPublication do
  scope :all, default: true
  scope('Rascunhos') { |scope| scope.where(status: 'draft') }
  scope('Publicados') { |scope| scope.where(status: 'published') }
  scope('Arquivados') { |scope| scope.where(status: 'archived') }

  filter :user
  filter :title
  filter :status
  filter :publication_type
  filter :category
  filter :published_at

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
    resource.publish!
    redirect_to resource_path(resource), notice: 'Publicação publicada.'
  end

  member_action :archive, method: :post do
    resource.archive!
    redirect_to resource_path(resource), notice: 'Publicação arquivada.'
  end
end
