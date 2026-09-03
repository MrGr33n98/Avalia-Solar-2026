class AddSalesOpportunityQueryIndexes < ActiveRecord::Migration[7.0]
  def change
    add_index :sales_opportunities, %i[status sales_pipeline_id sales_stage_id], name: 'idx_sales_opp_status_pipeline_stage'
    add_index :sales_opportunities, %i[owner_id status], name: 'idx_sales_opp_owner_status'
    add_index :sales_opportunities, :expected_close_date, name: 'idx_sales_opp_expected_close'
    add_index :sales_opportunities, :value_cents, name: 'idx_sales_opp_value_cents'
  end
end
