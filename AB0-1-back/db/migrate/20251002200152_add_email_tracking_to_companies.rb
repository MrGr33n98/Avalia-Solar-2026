# frozen_string_literal: true

# Migration for company email tracking - TASK-018
class AddEmailTrackingToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :email_notifications_enabled, :boolean, default: true, null: false
    add_column :companies, :last_digest_sent_at, :datetime
    
    if ActiveRecord::Base.connection.adapter_name =~ /PostgreSQL/i
      add_column :companies, :notification_preferences, :jsonb, default: {}
      add_index :companies, :notification_preferences, using: :gin
    else
      add_column :companies, :notification_preferences, :json, default: {}
      # GIN not supported on SQLite, standard index on text column is usually not useful for JSON querying unless virtual table
      # Skipping index or adding normal index (which might not be what we want but safer than GIN)
      # add_index :companies, :notification_preferences
    end
    
    add_index :companies, :email_notifications_enabled
  end
end
