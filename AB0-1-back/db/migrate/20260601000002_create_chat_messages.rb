# frozen_string_literal: true

class CreateChatMessages < ActiveRecord::Migration[7.0]
  def change
    create_table :chat_messages do |t|
      t.references :chat_session, null: false, foreign_key: true

      t.string :role, null: false # 'user', 'assistant', 'system'
      t.text :content, null: false
      t.string :model # e.g. 'gpt-4o-mini'
      t.integer :token_count
      t.integer :latency_ms
      t.string :safety_status, default: 'clean' # 'clean', 'flagged', 'blocked'
      t.string :intent_detected # 'solar_quote', 'ev_charger', etc.
      t.integer :feedback # -1 (thumbs down), 0 (none), 1 (thumbs up)

      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :chat_messages, :role
    add_index :chat_messages, :intent_detected
    add_index :chat_messages, :safety_status
    add_index :chat_messages, :created_at
    add_index :chat_messages, %i[chat_session_id created_at]
  end
end
