# frozen_string_literal: true

# Migration for company email tracking - TASK-018
class AddEmailTrackingToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :email_notifications_enabled, :boolean, default: true, null: false
    add_column :companies, :last_digest_sent_at, :datetime
    add_column :companies, :notification_preferences, :jsonb, default: {}
    
    add_index :companies, :email_notifications_enabled
    add_index :companies, :notification_preferences, using: :gin
  end
end
