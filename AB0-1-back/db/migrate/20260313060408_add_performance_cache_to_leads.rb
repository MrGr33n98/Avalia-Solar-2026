class AddPerformanceCacheToLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :leads, :cached_score, :integer, default: 0 unless column_exists?(:leads, :cached_score)
    add_column :leads, :score_band, :string unless column_exists?(:leads, :score_band)
    
    add_index :leads, :score_band unless index_exists?(:leads, :score_band)
    add_index :leads, :utm_source unless index_exists?(:leads, :utm_source)
    add_index :leads, :utm_medium unless index_exists?(:leads, :utm_medium)
    add_index :leads, :utm_campaign unless index_exists?(:leads, :utm_campaign)
    add_index :leads, :email unless index_exists?(:leads, :email)
  end
end
