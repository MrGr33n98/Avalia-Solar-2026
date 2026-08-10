class AddReportingIndexToBannerEvents < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    return if index_exists?(:banner_events, %i[tracked_at banner_id event_type], name: 'idx_banner_events_reporting_window')

    add_index :banner_events,
              %i[tracked_at banner_id event_type],
              name: 'idx_banner_events_reporting_window',
              where: 'valid_for_reporting = TRUE',
              algorithm: :concurrently
  end

  def down
    remove_index :banner_events, name: 'idx_banner_events_reporting_window', algorithm: :concurrently
  end
end
