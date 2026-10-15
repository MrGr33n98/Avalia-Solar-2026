# frozen_string_literal: true

class AddOutboundClickAndConsentToSalesTrackingSessions < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_tracking_sessions, :outbound_click_id, :uuid
    add_column :sales_tracking_sessions, :consent_state, :string, limit: 20, default: 'unknown', null: false
    add_column :sales_tracking_sessions, :as_click_id_hash, :string, limit: 64

    add_index :sales_tracking_sessions, :outbound_click_id
    add_index :sales_tracking_sessions, :consent_state
    add_foreign_key :sales_tracking_sessions, :outbound_clicks, column: :outbound_click_id, on_delete: :nullify
  end
end
