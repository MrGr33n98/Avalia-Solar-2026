# frozen_string_literal: true

class AddDetailedCtaTrackingToCompanyDailyStats < ActiveRecord::Migration[7.0]
  def change
    # Add granular CTA tracking columns
    add_column :company_daily_stats, :email_clicks, :integer, default: 0, null: false
    add_column :company_daily_stats, :phone_clicks, :integer, default: 0, null: false
    add_column :company_daily_stats, :website_clicks, :integer, default: 0, null: false
    
    # Add unique visits tracking (future enhancement)
    add_column :company_daily_stats, :unique_views, :integer, default: 0, null: false
    add_column :company_daily_stats, :returning_views, :integer, default: 0, null: false
    
    # Ensure efficient queries (column is 'day', not 'date')
    add_index :company_daily_stats, [:company_id, :day], unique: true, if_not_exists: true
    add_index :company_daily_stats, :day, if_not_exists: true
    
    # Backfill email/phone/website clicks based on existing proportions (optional)
    # This is conservative - better to start from 0 than to have fake data
    reversible do |dir|
      dir.up do
        # No backfill - start clean with real tracking data only
        Rails.logger.info('[Migration] AddDetailedCtaTracking: New columns added, no backfill')
      end
    end
  end
end
