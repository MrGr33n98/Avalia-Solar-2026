class AddReportingQualityToBannerEvents < ActiveRecord::Migration[7.0]
  def change
    add_column :banner_events, :valid_for_reporting, :boolean, null: false, default: true unless column_exists?(:banner_events, :valid_for_reporting)
    add_column :banner_events, :fraud_score, :integer, null: false, default: 0 unless column_exists?(:banner_events, :fraud_score)
    add_column :banner_events, :discard_reason, :string unless column_exists?(:banner_events, :discard_reason)
    add_index :banner_events, :valid_for_reporting unless index_exists?(:banner_events, :valid_for_reporting)
  end
end
