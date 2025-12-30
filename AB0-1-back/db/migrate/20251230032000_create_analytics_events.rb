# frozen_string_literal: true

class CreateAvaliaAnalyticsEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :analytics_events do |t|
      t.integer :company_id
      t.integer :user_id
      t.string :event_type, null: false
      t.jsonb :metadata, null: false, default: {}
      t.datetime :tracked_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }

      t.timestamps
    end

    add_index :analytics_events, %i[company_id tracked_at]
    add_index :analytics_events, %i[event_type tracked_at]
    add_index :analytics_events, %i[company_id event_type tracked_at], name: 'index_analytics_events_company_event_time'
  end
end
