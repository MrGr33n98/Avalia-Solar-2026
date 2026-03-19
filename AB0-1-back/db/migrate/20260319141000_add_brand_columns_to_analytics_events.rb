class AddBrandColumnsToAnalyticsEvents < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:analytics_events)

    add_column :analytics_events, :brand_id, :bigint unless column_exists?(:analytics_events, :brand_id)
    add_column :analytics_events, :brand_slug, :string unless column_exists?(:analytics_events, :brand_slug)
    add_column :analytics_events, :app_key, :string unless column_exists?(:analytics_events, :app_key)

    add_index :analytics_events, [:brand_id, :tracked_at], name: 'index_analytics_events_on_brand_time' unless index_exists?(:analytics_events, [:brand_id, :tracked_at], name: 'index_analytics_events_on_brand_time')
    add_index :analytics_events, [:brand_id, :event_type, :tracked_at], name: 'index_analytics_events_on_brand_event_time' unless index_exists?(:analytics_events, [:brand_id, :event_type, :tracked_at], name: 'index_analytics_events_on_brand_event_time')
    add_index :analytics_events, [:app_key, :tracked_at], name: 'index_analytics_events_on_app_key_time' unless index_exists?(:analytics_events, [:app_key, :tracked_at], name: 'index_analytics_events_on_app_key_time')

    add_foreign_key :analytics_events, :brands unless foreign_key_exists?(:analytics_events, :brands)
  end
end
