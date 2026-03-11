class CreateBuyerIntentActivities < ActiveRecord::Migration[7.0]
  def change
    enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')

    create_table :buyer_intent_activities, id: :uuid do |t|
      t.bigint   :company_id,        null: false
      t.bigint   :user_id
      t.string   :anonymous_id
      t.string   :session_id,        null: false
      t.string   :signal_type,       null: false
      t.string   :signal_category,   null: false
      t.integer  :intent_weight,     null: false, default: 1
      t.string   :element_selector
      t.string   :element_type
      t.string   :page_path,         null: false
      t.string   :referrer_host
      t.integer  :duration_ms
      t.jsonb    :metadata,          null: false, default: {}
      t.string   :ip_hash
      t.string   :user_agent
      t.string   :device_type
      t.datetime :tracked_at,        null: false
      t.timestamps
    end

    add_index :buyer_intent_activities, :company_id
    add_index :buyer_intent_activities, :user_id
    add_index :buyer_intent_activities, :anonymous_id
    add_index :buyer_intent_activities, :session_id
    add_index :buyer_intent_activities, :signal_type
    add_index :buyer_intent_activities, :signal_category
    add_index :buyer_intent_activities, :tracked_at
    add_index :buyer_intent_activities, [:company_id, :signal_type, :tracked_at], name: 'idx_intent_company_signal_time'
    add_index :buyer_intent_activities, [:anonymous_id, :tracked_at], name: 'idx_intent_anon_time', where: 'anonymous_id IS NOT NULL'
    add_index :buyer_intent_activities, :metadata, using: :gin

    add_foreign_key :buyer_intent_activities, :companies, column: :company_id
    add_foreign_key :buyer_intent_activities, :users, column: :user_id
  end
end
