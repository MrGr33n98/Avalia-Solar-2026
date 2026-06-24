class AddEnterpriseP2pChat < ActiveRecord::Migration[7.0]
  def change
    change_table :conversations, bulk: true do |t|
      t.string :status, null: false, default: 'open'
      t.datetime :last_message_at
      t.integer :user_unread_count, null: false, default: 0
      t.integer :company_unread_count, null: false, default: 0
      t.datetime :user_last_read_at
      t.datetime :company_last_read_at
      t.datetime :sla_due_at
      t.datetime :resolved_at
      t.datetime :blocked_at
      t.string :blocked_by_type
      t.bigint :blocked_by_id
      t.text :block_reason
      t.integer :report_count, null: false, default: 0
    end

    add_index :conversations, :status unless index_exists?(:conversations, :status)
    add_index :conversations, :last_message_at unless index_exists?(:conversations, :last_message_at)
    add_index :conversations, :sla_due_at unless index_exists?(:conversations, :sla_due_at)
    add_index :conversations, %i[blocked_by_type blocked_by_id], name: 'index_conversations_on_blocked_by' unless index_exists?(:conversations, %i[blocked_by_type blocked_by_id], name: 'index_conversations_on_blocked_by')

    change_table :direct_messages, bulk: true do |t|
      t.bigint :sender_id
      t.string :client_message_id
      t.datetime :delivered_at
      t.jsonb :metadata, null: false, default: {}
    end

    add_index :direct_messages, :sender_id unless index_exists?(:direct_messages, :sender_id)
    add_index :direct_messages, %i[conversation_id client_message_id],
              unique: true,
              where: 'client_message_id IS NOT NULL',
              name: 'index_direct_messages_on_conversation_and_client_id' unless index_exists?(:direct_messages, %i[conversation_id client_message_id], name: 'index_direct_messages_on_conversation_and_client_id')

    create_table :conversation_events do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :actor, null: true, foreign_key: { to_table: :users }
      t.string :event_type, null: false
      t.jsonb :metadata, null: false, default: {}
      t.datetime :created_at, null: false
    end
    add_index :conversation_events, :event_type unless index_exists?(:conversation_events, :event_type)

    create_table :conversation_reports do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :reporter, null: false, foreign_key: { to_table: :users }
      t.string :reason, null: false
      t.text :details
      t.string :status, null: false, default: 'open'
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :conversation_reports, :status unless index_exists?(:conversation_reports, :status)

    create_table :push_tokens do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token, null: false
      t.string :platform, null: false
      t.string :device_id
      t.boolean :active, null: false, default: true
      t.datetime :last_seen_at
      t.timestamps
    end
    add_index :push_tokens, :token, unique: true unless index_exists?(:push_tokens, :token)
    add_index :push_tokens, %i[user_id platform] unless index_exists?(:push_tokens, %i[user_id platform])
  end
end
