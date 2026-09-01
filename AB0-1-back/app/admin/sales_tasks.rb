ActiveAdmin.register Sales::Task, as: 'Sales Task' do
  menu label: 'CRM · Tasks'
  permit_params :sales_account_id, :sales_opportunity_id, :owner_id, :task_type, :title, :description, :status, :priority, :due_at
  index do
    selectable_column
    id_column
    column :title
    column :owner
    column :status
    column :priority
    column :due_at
    actions
  end
  filter :status
  filter :priority
  filter :due_at
end
