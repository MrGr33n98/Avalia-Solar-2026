class AddP2pChatEnabledToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :p2p_chat_enabled, :boolean, default: false, null: false
  end
end
