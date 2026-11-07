# frozen_string_literal: true

class AddIdempotentEventIdToBuyerIntentActivities < ActiveRecord::Migration[7.0]
  def change
    add_column :buyer_intent_activities, :event_id, :string, limit: 128

    # Existing rows remain valid (NULL); all newly received signals get an ID.
    # This prevents retries from silently inflating scores or activity counts.
    add_index :buyer_intent_activities, [:company_id, :event_id],
              unique: true, where: 'event_id IS NOT NULL',
              name: 'idx_buyer_intent_company_event_unique'
  end
end
