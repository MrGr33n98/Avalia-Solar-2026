class EnhanceAnalyticsCompanyEventTimeIndex < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    # Remove old index
    remove_index :analytics_events, 
      name: 'idx_analytics_company_time',
      algorithm: :concurrently,
      if_exists: true

    # Add enhanced index with event_type
    add_index :analytics_events,
      [:company_id, :event_type, :created_at],
      name: 'idx_analytics_company_event_time',
      algorithm: :concurrently
  end

  def down
    # Revert to old index
    remove_index :analytics_events,
      name: 'idx_analytics_company_event_time',
      algorithm: :concurrently,
      if_exists: true

    add_index :analytics_events,
      [:company_id, :created_at],
      name: 'idx_analytics_company_time',
      algorithm: :concurrently
  end
end
