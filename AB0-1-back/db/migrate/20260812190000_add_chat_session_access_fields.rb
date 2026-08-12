# frozen_string_literal: true

class AddChatSessionAccessFields < ActiveRecord::Migration[7.0]
  def change
    add_column :chat_sessions, :visitor_nonce, :string unless column_exists?(:chat_sessions, :visitor_nonce)
    add_column :chat_sessions, :access_token_version, :integer, null: false, default: 1 unless column_exists?(:chat_sessions, :access_token_version)
    ChatSession.reset_column_information
    ChatSession.where(visitor_nonce: nil).find_each do |session|
      session.update_columns(visitor_nonce: SecureRandom.hex(32))
    end
    add_index :chat_sessions, :visitor_nonce, unique: true unless index_exists?(:chat_sessions, :visitor_nonce, unique: true)
  end
end
