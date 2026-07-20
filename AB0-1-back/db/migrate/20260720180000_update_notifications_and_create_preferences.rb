# frozen_string_literal: true

class UpdateNotificationsAndCreatePreferences < ActiveRecord::Migration[7.0]
  def up
    unless table_exists?(:notifications)
      create_table :notifications do |t|
        t.references :user, null: false, foreign_key: { on_delete: :cascade }
        t.string :notification_type, null: false
        t.string :title, null: false
        t.text :message
        t.json :data
        t.string :notifiable_type
        t.bigint :notifiable_id
        t.datetime :read_at
        t.datetime :sent_at
        t.string :delivery_channels, default: ["in_app"], array: true
        t.datetime :archived_at
        t.string :category, default: 'system'
        t.string :actionable_type
        t.bigint :actionable_id
        t.bigint :company_id
        t.bigint :quote_request_id
        t.bigint :conversation_id
        t.bigint :review_id
        t.jsonb :metadata_json, default: {}
        t.timestamps
      end

      add_index :notifications, :notification_type unless index_exists?(:notifications, :notification_type)
      add_index :notifications, :read_at unless index_exists?(:notifications, :read_at)
      add_index :notifications, :created_at unless index_exists?(:notifications, :created_at)
      add_index :notifications, [:user_id, :read_at] unless index_exists?(:notifications, [:user_id, :read_at])
      add_index :notifications, :archived_at unless index_exists?(:notifications, :archived_at)
      add_index :notifications, :category unless index_exists?(:notifications, :category)
      add_index :notifications, [:user_id, :archived_at] unless index_exists?(:notifications, [:user_id, :archived_at])
      add_index :notifications, [:user_id, :category] unless index_exists?(:notifications, [:user_id, :category])
    else
      change_table :notifications do |t|
        t.datetime :archived_at unless column_exists?(:notifications, :archived_at)
        t.string :category, default: 'system' unless column_exists?(:notifications, :category)
        t.string :actionable_type unless column_exists?(:notifications, :actionable_type)
        t.bigint :actionable_id unless column_exists?(:notifications, :actionable_id)
        t.bigint :company_id unless column_exists?(:notifications, :company_id)
        t.bigint :quote_request_id unless column_exists?(:notifications, :quote_request_id)
        t.bigint :conversation_id unless column_exists?(:notifications, :conversation_id)
        t.bigint :review_id unless column_exists?(:notifications, :review_id)
        t.jsonb :metadata_json, default: {} unless column_exists?(:notifications, :metadata_json)
      end

      add_index :notifications, :archived_at unless index_exists?(:notifications, :archived_at)
      add_index :notifications, :category unless index_exists?(:notifications, :category)
      add_index :notifications, [:user_id, :archived_at] unless index_exists?(:notifications, [:user_id, :archived_at])
      add_index :notifications, [:user_id, :category] unless index_exists?(:notifications, [:user_id, :category])
    end

    unless table_exists?(:notification_preferences)
      create_table :notification_preferences do |t|
        t.references :user, null: false, foreign_key: { on_delete: :cascade }
        t.string :event_type, null: false
        t.boolean :in_app_enabled, default: true, null: false
        t.boolean :email_enabled, default: true, null: false
        t.boolean :push_enabled, default: true, null: false
        t.boolean :whatsapp_enabled, default: false, null: false
        t.string :frequency, default: 'immediately', null: false
        t.string :consent_version
        t.datetime :consented_at
        t.timestamps
      end

      add_index :notification_preferences, [:user_id, :event_type], unique: true unless index_exists?(:notification_preferences, [:user_id, :event_type], unique: true)
    end
  end

  def down
    remove_index :notification_preferences, column: [:user_id, :event_type] if index_exists?(:notification_preferences, [:user_id, :event_type])
    drop_table :notification_preferences if table_exists?(:notification_preferences)
  end
end
