# frozen_string_literal: true

# Notification system - TASK-019
class CreateNotifications < ActiveRecord::Migration[7.0]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :notification_type, null: false
      t.string :title, null: false
      t.text :message
      t.json :data # Additional data
      t.references :notifiable, polymorphic: true, index: true # Related object
      t.datetime :read_at
      t.datetime :sent_at
      t.string :delivery_channels, array: true, default: ['in_app'] # ['in_app', 'email', 'push']

      t.timestamps
    end

    add_index :notifications, :notification_type
    add_index :notifications, :read_at
    add_index :notifications, :created_at
    add_index :notifications, [:user_id, :read_at]
  end
end
