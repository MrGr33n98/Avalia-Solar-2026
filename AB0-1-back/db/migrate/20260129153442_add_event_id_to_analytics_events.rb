class AddEventIdToAnalyticsEvents < ActiveRecord::Migration[7.0]
  def change
    add_column :analytics_events, :event_id, :string
    add_index :analytics_events, :event_id, unique: true
  end
end
