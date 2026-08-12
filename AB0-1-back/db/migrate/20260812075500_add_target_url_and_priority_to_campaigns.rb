class AddTargetUrlAndPriorityToCampaigns < ActiveRecord::Migration[7.0]
  def change
    add_column :campaigns, :target_url, :string
    add_column :campaigns, :priority, :integer, default: 0
  end
end
