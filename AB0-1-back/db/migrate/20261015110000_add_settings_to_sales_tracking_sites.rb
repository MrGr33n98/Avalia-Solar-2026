# frozen_string_literal: true

class AddSettingsToSalesTrackingSites < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_tracking_sites, :settings, :jsonb, default: {}, null: false
  end
end
