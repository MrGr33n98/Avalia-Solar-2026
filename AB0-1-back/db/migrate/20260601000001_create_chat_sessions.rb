# frozen_string_literal: true

class CreateChatSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :chat_sessions do |t|
      t.string :visitor_id, null: false
      t.references :user, foreign_key: true, null: true

      # Page context
      t.string :page_url
      t.string :source_page
      t.string :referrer

      # UTM tracking
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.string :utm_term
      t.string :utm_content

      # Classification
      t.string :vertical
      t.string :status, default: 'active', null: false

      # Timestamps de sessão
      t.datetime :started_at, null: false
      t.datetime :ended_at
      t.datetime :last_message_at
      t.integer :message_count, default: 0, null: false

      # Contexto flexível
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :chat_sessions, :visitor_id
    add_index :chat_sessions, :status
    add_index :chat_sessions, :vertical
    add_index :chat_sessions, :source_page
    add_index :chat_sessions, :created_at
    add_index :chat_sessions, :utm_source
    add_index :chat_sessions, :utm_campaign
    add_index :chat_sessions, %i[visitor_id created_at]
  end
end
