ActiveAdmin.register LeadDistribution do
  menu label: 'Distribuição de leads', priority: 7

  includes :lead, :company, :marketplace_proposal
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
    column :marketplace_proposal do |distribution|
      if distribution.marketplace_proposal
        link_to distribution.marketplace_proposal.reference, admin_marketplace_proposal_path(distribution.marketplace_proposal)
      else
        status_tag 'Aguardando proposta', class: 'warning'
      end
    end
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
      row :marketplace_proposal do |distribution|
        if distribution.marketplace_proposal
          link_to distribution.marketplace_proposal.reference, admin_marketplace_proposal_path(distribution.marketplace_proposal)
        else
          'Ainda não criada'
        end
      end
      row :assigned_at
      row :payload
      row :created_at
      row :updated_at
    end
  end
end
