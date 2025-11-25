# frozen_string_literal: true

# Migration for email tracking - TASK-018
class AddEmailTrackingToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :welcome_email_sent_at, :datetime
    add_column :users, :last_email_sent_at, :datetime
    add_column :users, :email_notifications_enabled, :boolean, default: true, null: false
    
    add_index :users, :email_notifications_enabled
  end
end
