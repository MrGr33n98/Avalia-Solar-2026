class AddQuoteClicksToAnalyticsAggregates < ActiveRecord::Migration[7.0]
  def change
    add_column :company_daily_stats, :quote_clicks, :integer, default: 0, null: false
    add_column :company_utm_attributions, :quote_clicks, :integer, default: 0, null: false
  end
end
