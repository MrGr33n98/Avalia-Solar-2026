# frozen_string_literal: true

class CreateConversationProposalLinks < ActiveRecord::Migration[7.0]
  def change
    create_table :conversation_proposal_links do |t|
      t.references :conversation, null: false, foreign_key: true, index: false
      t.references :marketplace_proposal, null: false, foreign_key: true, index: false
      t.references :linked_by_user, foreign_key: { to_table: :users }, index: true

      t.timestamps
    end

    add_index :conversation_proposal_links,
              %i[conversation_id marketplace_proposal_id],
              unique: true,
              name: 'index_conv_prop_links_on_conv_and_prop'
    add_index :conversation_proposal_links,
              :marketplace_proposal_id,
              name: 'index_conv_prop_links_on_prop_id'

    reversible do |dir|
      dir.up do
        # Backfill idempotente a partir da FK legado existente nas conversas
        execute <<-SQL.squish
          INSERT INTO conversation_proposal_links (conversation_id, marketplace_proposal_id, linked_by_user_id, created_at, updated_at)
          SELECT id, marketplace_proposal_id, user_id, NOW(), NOW()
          FROM conversations
          WHERE marketplace_proposal_id IS NOT NULL
          ON CONFLICT (conversation_id, marketplace_proposal_id) DO NOTHING;
        SQL
      end
    end
  end
end
