# frozen_string_literal: true

class CreateOutboundClicks < ActiveRecord::Migration[7.0]
  def change
    create_table :outbound_clicks, id: :uuid do |t|
      t.references :company, null: false, foreign_key: true, index: true
      t.references :anonymous_session, type: :uuid, foreign_key: false, index: true
      t.string :source_context, null: false, limit: 50, default: 'profile'
      t.string :destination_type, null: false, limit: 50, default: 'website'
      t.string :target_url, null: false, limit: 2048
      t.string :click_token_signature, null: false, limit: 128
      t.string :ip_hash, limit: 64
      t.string :user_agent_hash, limit: 64
      t.string :idempotency_key, limit: 128
      t.datetime :clicked_at, null: false, index: true

      t.timestamps
    end

    add_index :outbound_clicks, %i[company_id clicked_at]
    add_index :outbound_clicks, :click_token_signature
    add_index :outbound_clicks, :idempotency_key, unique: true
  end
end
