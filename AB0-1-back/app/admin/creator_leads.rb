ActiveAdmin.register CreatorLead do
  menu label: 'Leads de creators', parent: 'Reviews'
  permit_params :status, :admin_notes
  filter :creator_user
  filter :publication
  filter :intent
  filter :email
  filter :created_at
  filter :status

  scope :all, default: true
  CreatorLead::STATUSES.each { |status| scope status.to_sym, -> { where(status: status) } }

  member_action :mark_contacted, method: :post do
    resource.update!(status: 'contacted', handled_at: Time.current)
    redirect_to resource_path(resource), notice: 'Lead marcado como contatado.'
  end

  member_action :mark_qualified, method: :post do
    resource.update!(status: 'qualified')
    redirect_to resource_path(resource), notice: 'Lead qualificado.'
  end

  index do
    selectable_column
    id_column
    column :creator_user
    column :publication
    column :name
    column :email
    column :intent
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :status, as: :select, collection: CreatorLead::STATUSES
      f.input :admin_notes
    end
    f.actions
  end
end
