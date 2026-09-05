class AddAudienceToSalesCampaigns < ActiveRecord::Migration[7.0]
  def change
    add_reference :sales_campaigns, :audience, foreign_key: { to_table: :sales_audiences }, index: true
  end
end
