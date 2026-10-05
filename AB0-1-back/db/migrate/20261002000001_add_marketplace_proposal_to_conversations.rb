class AddMarketplaceProposalToConversations < ActiveRecord::Migration[7.0]
  def change
    add_reference :conversations, :marketplace_proposal, foreign_key: true
    add_index :conversations, %i[marketplace_proposal_id user_id]
  end
end
