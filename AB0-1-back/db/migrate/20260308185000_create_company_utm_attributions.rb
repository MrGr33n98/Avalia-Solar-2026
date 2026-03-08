# frozen_string_literal: true

class CreateCompanyUtmAttributions < ActiveRecord::Migration[7.0]
  def change
    create_table :company_utm_attributions do |t|
      t.references :company, null: false, foreign_key: true, index: true
      
      # UTM Parameters
      t.string :utm_source, limit: 100
      t.string :utm_medium, limit: 100
      t.string :utm_campaign, limit: 200
      t.string :utm_content, limit: 200
      t.string :utm_term, limit: 200
      
      # Aggregated Metrics
      t.integer :total_visits, default: 0, null: false
      t.integer :total_cta_clicks, default: 0, null: false
      t.integer :total_leads, default: 0, null: false
      t.decimal :conversion_rate, precision: 5, scale: 2, default: 0.0
      
      # Breakdown by CTA Type
      t.integer :whatsapp_clicks, default: 0, null: false
      t.integer :email_clicks, default: 0, null: false
      t.integer :phone_clicks, default: 0, null: false
      t.integer :website_clicks, default: 0, null: false
      
      # Revenue Attribution (optional, for future)
      t.decimal :attributed_revenue, precision: 10, scale: 2, default: 0.0
      
      # Tracking Period
      t.date :first_seen_at
      t.date :last_seen_at
      
      t.timestamps
    end

    # Composite index for efficient lookups
    add_index :company_utm_attributions, 
              [:company_id, :utm_source, :utm_medium, :utm_campaign], 
              name: 'index_utm_attributions_on_company_and_params',
              unique: true
    
    # Index for campaign performance queries
    add_index :company_utm_attributions, [:utm_campaign, :total_leads], 
              name: 'index_utm_attributions_on_campaign_leads'
    
    # Index for date range queries
    add_index :company_utm_attributions, [:last_seen_at], 
              name: 'index_utm_attributions_on_last_seen'
  end
end
