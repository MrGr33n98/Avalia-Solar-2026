ActiveAdmin.register Sales::Opportunity, as: 'Sales Opportunity' do
  menu label: 'CRM · Opportunities'
  permit_params :name, :sales_account_id, :sales_pipeline_id, :sales_stage_id, :owner_id, :value_cents, :probability, :status,
                :expected_close_date, :lost_reason, :lost_notes
  index do
    selectable_column
    id_column
    column :name
    column('Account') { |opportunity| opportunity.account.name }
    column('Stage') { |opportunity| opportunity.stage.name }
    column :value_cents
    column :probability
    column :status
    actions
  end
  filter :name
  filter :status
  filter :sales_stage
  filter :owner
end
