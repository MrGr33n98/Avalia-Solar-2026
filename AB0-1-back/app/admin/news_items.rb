ActiveAdmin.register NewsItem do
  scope :all, default: true
  scope('Rascunhos') { |scope| scope.where(status: 'draft') }
  scope('Publicados') { |scope| scope.where(status: 'published') }
  scope('Arquivados') { |scope| scope.where(status: 'archived') }
  filter :title
  filter :status
  filter :category
  filter :published_at
  permit_params :title, :summary, :source_name, :source_url, :category, :reading_time_minutes, :published_at, :status

  index do
    selectable_column
    id_column
    column :title
    column :category
    column :status
    column :source_name
    column :published_at
    actions
  end

  member_action :publish, method: :post do
    resource.publish!(actor: current_user)
    Social::CreateFeedItemJob.perform_now('NewsItem', resource.id)
    redirect_to resource_path(resource), notice: 'Notícia publicada.'
  end
end
