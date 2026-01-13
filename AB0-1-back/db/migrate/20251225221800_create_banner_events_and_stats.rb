class CreateBannerEventsAndStats < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_events do |t|
      t.references :banner, null: false, foreign_key: true
      t.references :company, null: true, foreign_key: true

      t.string :event_type, null: false # view|click
      t.string :ip_hash
      t.string :user_agent_hash
      t.string :referrer
      t.json :utm_json, null: false, default: {}
      t.json :metadata_json, null: false, default: {}

      t.datetime :tracked_at, null: false
      t.timestamps
    end

    add_index :banner_events, :event_type
    add_index :banner_events, :tracked_at

    create_table :banner_daily_stats do |t|
      t.references :banner, null: false, foreign_key: true
      t.date :day, null: false
      t.integer :views_count, null: false, default: 0
      t.integer :clicks_count, null: false, default: 0
      t.decimal :ctr, null: false, default: 0
      t.timestamps
    end

    add_index :banner_daily_stats, [:banner_id, :day], unique: true
  end
end
