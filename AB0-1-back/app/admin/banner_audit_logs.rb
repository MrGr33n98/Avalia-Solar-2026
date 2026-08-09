ActiveAdmin.register BannerAuditLog do
  menu parent: 'Avalia Solar Ads', priority: 5, label: 'Auditoria (Logs)'
  actions :index, :show

  index do
    id_column
    column :company
    column :banner
    column :banner_addon_subscription
    column :action do |log|
      status_tag log.action
    end
    column :origin
    column :admin_user
    column :created_at
    actions
  end

  filter :company
  filter :banner
  filter :banner_addon_subscription
  filter :action
  filter :origin
  filter :admin_user
  filter :created_at

  show do
    attributes_table do
      row :id
      row :company
      row :banner
      row :banner_addon_subscription
      row :action do |log|
        status_tag log.action
      end
      row :origin
      row :admin_user
      row :webhook_event_id
      row :details do |log|
        pre JSON.pretty_generate(log.details || {})
      end
      row :created_at
    end
  end
end
