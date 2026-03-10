class EnhanceAnalyticsEventsForMicroInteractions < ActiveRecord::Migration[7.0]
  def change
    # Add micro-interaction specific columns
    add_column :analytics_events, :action, :string
    add_column :analytics_events, :duration_ms, :integer
    add_column :analytics_events, :element_id, :string
    add_column :analytics_events, :element_type, :string
    add_column :analytics_events, :position_x, :integer
    add_column :analytics_events, :position_y, :integer
    add_column :analytics_events, :viewport_width, :integer
    add_column :analytics_events, :viewport_height, :integer
    add_column :analytics_events, :anonymous_id, :string
    add_column :analytics_events, :context, :jsonb, default: {}

    # Add indexes for common queries
    add_index :analytics_events, :action
    add_index :analytics_events, :element_type
    add_index :analytics_events, [:event_type, :action]
    add_index :analytics_events, [:company_id, :action], 
              where: "company_id IS NOT NULL",
              name: "idx_analytics_company_action"
    add_index :analytics_events, :anonymous_id
  end
end
