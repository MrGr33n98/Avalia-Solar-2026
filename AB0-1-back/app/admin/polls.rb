ActiveAdmin.register Poll do
  scope :all, default: true
  scope('Rascunhos') { |scope| scope.where(status: 'draft') }
  scope('Publicados') { |scope| scope.where(status: 'published') }
  scope('Encerrados') { |scope| scope.where(status: 'closed') }
  filter :question
  filter :status
  filter :ends_at
  permit_params :question, :ends_at, :status, poll_options_attributes: %i[id label _destroy]

  index do
    selectable_column
    id_column
    column :question
    column :status
    column :ends_at
    column('Opções') { |poll| poll.poll_options.size }
    actions
  end

  form do |f|
    f.inputs do
      f.input :question
      f.input :ends_at, as: :datepicker
      f.input :status, as: :select, collection: [%w[Rascunho draft], %w[Publicado published], %w[Encerrado closed]]
      f.has_many :poll_options, allow_destroy: false, new_record: true do |option|
        option.input :label
      end
    end
    f.actions
  end

  member_action :publish, method: :post do
    resource.publish!(actor: current_user)
    Social::CreateFeedItemJob.perform_now('Poll', resource.id)
    redirect_to resource_path(resource), notice: 'Enquete publicada.'
  end
end
