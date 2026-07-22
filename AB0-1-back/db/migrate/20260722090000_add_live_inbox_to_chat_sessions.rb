# frozen_string_literal: true

class AddLiveInboxToChatSessions < ActiveRecord::Migration[7.0]
  def change
    change_table :chat_sessions, bulk: true do |t|
      t.references :company, foreign_key: true, null: true
      t.references :assigned_agent, foreign_key: { to_table: :users }, null: true
      t.string :mode, null: false, default: 'bot_only'
      t.string :inbox_status, null: false, default: 'active'
      t.integer :company_unread_count, null: false, default: 0
      t.datetime :human_requested_at
      t.datetime :human_taken_over_at
      t.datetime :last_customer_message_at
      t.datetime :last_agent_message_at
      t.datetime :archived_at
      t.integer :lock_version, null: false, default: 0
    end

    change_table :chat_messages, bulk: true do |t|
      t.references :sender, foreign_key: { to_table: :users }, null: true
      t.string :client_message_id
    end

    add_index :chat_sessions, %i[company_id inbox_status last_message_at],
              name: 'index_chat_sessions_live_inbox'
    add_index :chat_sessions, %i[company_id company_unread_count],
              name: 'index_chat_sessions_company_unread'
    add_index :chat_messages, %i[chat_session_id client_message_id],
              unique: true,
              where: 'client_message_id IS NOT NULL',
              name: 'index_chat_messages_idempotency'
  end
end
