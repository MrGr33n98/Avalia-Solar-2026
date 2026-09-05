# frozen_string_literal: true

class CreateSalesCampaignDailyMetrics < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_campaign_daily_metrics do |t|
      t.bigint :company_id, null: false
      t.bigint :sales_campaign_id, null: false
      t.date :metric_date, null: false
      t.integer :sent_count, default: 0, null: false
      t.integer :delivered_count, default: 0, null: false
      t.integer :open_count, default: 0, null: false
      t.integer :click_count, default: 0, null: false
      t.integer :bounce_count, default: 0, null: false
      t.integer :unsubscribe_count, default: 0, null: false
      t.bigint :revenue_cents, default: 0, null: false

      t.timestamps
    end

    add_index :sales_campaign_daily_metrics, %i[sales_campaign_id metric_date], unique: true, name: 'idx_campaign_daily_metrics_uniq'
    add_index :sales_campaign_daily_metrics, %i[company_id metric_date], name: 'idx_campaign_daily_metrics_company_date'
  end
end
