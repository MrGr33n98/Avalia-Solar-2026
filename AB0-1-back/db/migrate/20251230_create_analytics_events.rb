class CreateAnalyticsEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :analytics_events do |t|
      t.references :company, index: true, foreign_key: true
      t.references :user, index: true, foreign_key: true
      t.string :event_type, null: false
      t.string :source
      t.jsonb :metadata, null: false, default: {}
      t.datetime :tracked_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.timestamps
    end

    add_index :analytics_events, [:company_id, :tracked_at]
    add_index :analytics_events, :event_type
    add_index :analytics_events, :source
    add_index :analytics_events, :metadata, using: :gin
  end
end
