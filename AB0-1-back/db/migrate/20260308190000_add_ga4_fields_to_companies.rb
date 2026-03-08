# frozen_string_literal: true

class AddGa4FieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :ga4_property_id, :string
    add_column :companies, :ga4_last_sync, :datetime
    add_column :companies, :engagement_metrics, :jsonb, default: {}
    
    add_index :companies, :ga4_property_id, where: "ga4_property_id IS NOT NULL"
  end
end
