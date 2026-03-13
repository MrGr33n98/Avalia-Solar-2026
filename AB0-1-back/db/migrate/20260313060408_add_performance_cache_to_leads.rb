class AddPerformanceCacheToLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :leads, :cached_score, :integer, default: 0
    add_column :leads, :score_band, :string
    
    add_index :leads, :score_band
    add_index :leads, :utm_source
    add_index :leads, :utm_medium
    add_index :leads, :utm_campaign
    add_index :leads, :email
  end
end
