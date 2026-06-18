class AddUniqueIndexToConversationsUserCompany < ActiveRecord::Migration[7.0]
  def change
    add_index :conversations, [:user_id, :company_id],
              unique: true,
              name: 'index_conversations_on_user_id_and_company_id_unique',
              if_not_exists: true
  end
end
