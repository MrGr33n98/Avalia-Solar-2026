class AddLeadsAndCostToBannerDailyStats < ActiveRecord::Migration[7.0]
  def change
    add_column :banner_daily_stats, :leads_count, :integer, default: 0, null: false
    add_column :banner_daily_stats, :cost_cents, :integer, default: 0, null: false
  end
end
