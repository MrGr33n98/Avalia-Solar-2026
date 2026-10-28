# frozen_string_literal: true

class SalesInboxOpcaoAFoundation < ActiveRecord::Migration[7.0]
  def change
    # 1. Expand sales_email_accounts with Zoho/OAuth identity & lifecycle
    change_table :sales_email_accounts, bulk: true do |t|
      t.string :provider_account_id unless column_exists?(:sales_email_accounts, :provider_account_id)
      t.string :provider_region, default: 'us' unless column_exists?(:sales_email_accounts, :provider_region)
      t.string :connection_status, default: 'pending', null: false unless column_exists?(:sales_email_accounts, :connection_status)
      t.datetime :access_token_expires_at unless column_exists?(:sales_email_accounts, :access_token_expires_at)
      t.jsonb :granted_scopes, default: [] unless column_exists?(:sales_email_accounts, :granted_scopes)
    end

    unless index_exists?(:sales_email_accounts, %i[company_id provider provider_account_id], name: 'idx_crm_mailbox_provider_identity')
      add_index :sales_email_accounts,
                %i[company_id provider provider_account_id],
                unique: true,
                where: 'provider_account_id IS NOT NULL',
                name: 'idx_crm_mailbox_provider_identity'
    end

    # 2. Expand sales_email_threads with account ownership, assignee, status, opportunity link
    change_table :sales_email_threads, bulk: true do |t|
      t.references :sales_email_account, foreign_key: { to_table: :sales_email_accounts }, index: true unless column_exists?(:sales_email_threads, :sales_email_account_id)
      t.references :assigned_user, foreign_key: { to_table: :users }, index: true unless column_exists?(:sales_email_threads, :assigned_user_id)
      t.string :status, default: 'open', null: false unless column_exists?(:sales_email_threads, :status)
      t.references :sales_opportunity, foreign_key: { to_table: :sales_opportunities }, index: true unless column_exists?(:sales_email_threads, :sales_opportunity_id)
    end

    unless index_exists?(:sales_email_threads, %i[sales_email_account_id status], name: 'idx_email_threads_account_status')
      add_index :sales_email_threads, %i[sales_email_account_id status], name: 'idx_email_threads_account_status'
    end

    # 3. Expand sales_email_messages with folder, received timestamp and raw headers
    change_table :sales_email_messages, bulk: true do |t|
      t.string :direction, default: 'outbound', null: false unless column_exists?(:sales_email_messages, :direction)
      t.string :provider_folder_id unless column_exists?(:sales_email_messages, :provider_folder_id)
      t.datetime :provider_received_at unless column_exists?(:sales_email_messages, :provider_received_at)
      t.jsonb :raw_headers, default: {} unless column_exists?(:sales_email_messages, :raw_headers)
    end

    unless index_exists?(:sales_email_messages, %i[sales_email_account_id provider_message_id], name: 'idx_crm_mailbox_message_identity')
      add_index :sales_email_messages,
                %i[sales_email_account_id provider_message_id],
                unique: true,
                where: 'sales_email_account_id IS NOT NULL AND provider_message_id IS NOT NULL',
                name: 'idx_crm_mailbox_message_identity'
    end

    # 4. Table sales_email_sync_states for incremental checkpoint and cursor tracking
    create_table :sales_email_sync_states, if_not_exists: true do |t|
      t.references :company, null: false, foreign_key: true
      t.references :sales_email_account, null: false, foreign_key: { to_table: :sales_email_accounts }
      t.string :provider_folder_id, null: false
      t.string :cursor
      t.datetime :high_watermark_at
      t.datetime :last_started_at
      t.datetime :last_succeeded_at
      t.string :last_error_code
      t.integer :retry_count, default: 0, null: false
      t.datetime :lease_until
      t.timestamps
    end

    unless index_exists?(:sales_email_sync_states, %i[sales_email_account_id provider_folder_id], name: 'idx_email_sync_states_account_folder')
      add_index :sales_email_sync_states,
                %i[sales_email_account_id provider_folder_id],
                unique: true,
                name: 'idx_email_sync_states_account_folder'
    end
  end
end
