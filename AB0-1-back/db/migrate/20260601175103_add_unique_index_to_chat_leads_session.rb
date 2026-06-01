class AddUniqueIndexToChatLeadsSession < ActiveRecord::Migration[7.0]
  INDEX_NAME = 'index_chat_leads_on_chat_session_id'

  def up
    remove_index :chat_leads, name: INDEX_NAME if index_exists?(:chat_leads, :chat_session_id, name: INDEX_NAME)

    execute <<~SQL.squish
      DELETE FROM chat_leads
      WHERE id IN (
        SELECT id
        FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY chat_session_id
                   ORDER BY updated_at DESC, created_at DESC, id DESC
                 ) AS row_number
          FROM chat_leads
          WHERE chat_session_id IS NOT NULL
        ) ranked_chat_leads
        WHERE row_number > 1
      )
    SQL

    return if index_exists?(:chat_leads, :chat_session_id, unique: true, where: 'chat_session_id IS NOT NULL', name: INDEX_NAME)

    add_index :chat_leads,
              :chat_session_id,
              unique: true,
              where: 'chat_session_id IS NOT NULL',
              name: INDEX_NAME
  end

  def down
    remove_index :chat_leads, name: INDEX_NAME if index_exists?(:chat_leads, :chat_session_id, name: INDEX_NAME)

    add_index :chat_leads, :chat_session_id, name: INDEX_NAME unless index_exists?(:chat_leads, :chat_session_id, name: INDEX_NAME)
  end
end
