ActiveAdmin.register ReviewerPublicationComment do
  permit_params :status
  includes :reviewer_publication, :user
  scope :all
  scope('Ativos') { |comments| comments.where(status: 'active') }
  scope('Ocultos') { |comments| comments.where(status: 'hidden') }
  filter :reviewer_publication
  filter :name
  filter :email
  filter :status
  filter :created_at
  index do
    selectable_column
    id_column
    column :reviewer_publication
    column :name
    column :email
    column :body
    column :status
    column :created_at
    actions
  end
  member_action :hide, method: :post do
    resource.update!(status: 'hidden')
    redirect_to resource_path(resource), notice: 'Comentário ocultado.'
  end
  member_action :unhide, method: :post do
    resource.update!(status: 'active')
    redirect_to resource_path(resource), notice: 'Comentário reativado.'
  end
end
