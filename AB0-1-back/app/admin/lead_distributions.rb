ActiveAdmin.register LeadDistribution do
  menu label: 'Lead Distributions'

  includes :lead, :company
  actions :index, :show, :destroy

  filter :lead_id
  filter :company_id
  filter :status
  filter :assigned_at
  filter :created_at

  index do
    selectable_column
    id_column
    column :lead
    column :company
    column :status
    column("Regra usada", sortable: false) { |distribution| distribution.rule_explanation }
    column :assigned_at
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :lead
      row :company
      row :status
      row :assigned_at
      row :payload
      row :created_at
      row :updated_at
    end
  end
end
