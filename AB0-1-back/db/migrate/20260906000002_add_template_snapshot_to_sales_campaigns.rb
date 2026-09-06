class AddTemplateSnapshotToSalesCampaigns < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_campaigns, :template_snapshot, :jsonb, null: false, default: {}
    add_column :sales_campaigns, :template_snapshot_at, :datetime
    add_index :sales_campaigns, :template_snapshot_at
  end
end
