class AddUniqueIndexToChatLeadsSession < ActiveRecord::Migration[7.0]
  def change
    remove_index :chat_leads, :chat_session_id if index_exists?(:chat_leads, :chat_session_id)
    add_index :chat_leads, :chat_session_id, unique: true
  end
end
