# frozen_string_literal: true

class AddAnalyticsCountersToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :profile_views_count, :integer, null: false, default: 0
    add_column :companies, :cta_clicks_count, :integer, null: false, default: 0
    add_column :companies, :whatsapp_clicks_count, :integer, null: false, default: 0

    add_index :companies, :profile_views_count
    add_index :companies, :cta_clicks_count
    add_index :companies, :whatsapp_clicks_count
  end
end
