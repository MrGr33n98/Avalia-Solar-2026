ActiveAdmin.register PendingChange do
  actions :index, :show

  scope :all
  scope :pending
  scope :approved
  scope :rejected

  filter :created_at
  filter :user
  filter :change_type, as: :select, collection: -> { PendingChange.change_types.keys }
  filter :status, as: :select, collection: -> { PendingChange.statuses.keys }
  filter :company

  index do
    selectable_column
    id_column
    column :company
    column :user
    column :change_type
    column :status
    column('Preview') { |pc| pc.data&.slice('action', 'video_id', 'url', 'thumbnail_url') }
    column :created_at
    actions defaults: true do |pc|
      if pc.status == 'pending'
        item 'Aprovar', approve_admin_pending_change_path(pc), method: :patch, class: 'member_link'
        item 'Rejeitar', reject_admin_pending_change_path(pc), method: :patch, class: 'member_link'
      end
    end
  end

  show do
    attributes_table do
      row :company
      row :user
      row :change_type
      row :status
      row :data
      row :created_at
      row :updated_at
    end
    active_admin_comments
  end

  member_action :approve, method: :patch do
    resource.update!(
      status: 'approved',
      approved_at: Time.current,
      approved_by: current_admin_user,
      approved_ip: request.remote_ip,
      approved_user_agent: request.user_agent
    )
    resource.apply_changes!
    redirect_to resource_path, notice: 'Mudança aprovada e aplicada.'
  end

  member_action :reject, method: :patch do
    resource.update!(
      status: 'rejected',
      rejected_at: Time.current,
      rejected_ip: request.remote_ip,
      rejected_user_agent: request.user_agent
    )
    redirect_to resource_path, alert: 'Mudança rejeitada.'
  end
end
