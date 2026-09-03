# frozen_string_literal: true

class CreateSalesEmailPlatform < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_email_accounts, if_not_exists: true do |t|
      t.references :user, null: false, foreign_key: true
      t.string :email, null: false
      t.string :provider, default: 'ses', null: false # ses, google, microsoft
      t.text :access_token_encrypted
      t.text :refresh_token_encrypted
      t.string :sync_status, default: 'idle', null: false
      t.datetime :last_synced_at
      t.integer :messages_imported, default: 0, null: false
      t.integer :messages_failed, default: 0, null: false
      t.text :sync_error
      t.timestamps
    end

    add_index :sales_email_accounts, [:user_id, :email], unique: true, if_not_exists: true

    create_table :sales_email_threads, if_not_exists: true do |t|
      t.string :provider_thread_id
      t.string :subject_normalized
      t.datetime :first_message_at
      t.datetime :last_message_at
      t.integer :message_count, default: 0, null: false
      t.timestamps
    end

    add_index :sales_email_threads, :provider_thread_id, if_not_exists: true

    create_table :sales_email_participants, if_not_exists: true do |t|
      t.references :sales_email_message, null: false, foreign_key: { to_table: :sales_email_messages }
      t.references :sales_contact, foreign_key: { to_table: :sales_contacts }
      t.string :participant_type, null: false # from, to, cc, bcc, reply_to
      t.string :name
      t.string :email, null: false
      t.timestamps
    end

    add_index :sales_email_participants, [:sales_email_message_id, :participant_type], name: 'idx_email_participants_type', if_not_exists: true

    create_table :sales_email_attachments, if_not_exists: true do |t|
      t.references :sales_email_message, null: false, foreign_key: { to_table: :sales_email_messages }
      t.string :file_name, null: false
      t.string :content_type, null: false
      t.bigint :file_size, default: 0, null: false
      t.boolean :inline, default: false, null: false
      t.string :content_id
      t.timestamps
    end

    create_table :sales_email_templates, if_not_exists: true do |t|
      t.string :name, null: false
      t.string :subject_template, null: false
      t.jsonb :body_json, default: {}, null: false
      t.text :body_html
      t.string :category, default: 'outreach', null: false
      t.references :user, foreign_key: true
      t.timestamps
    end

    create_table :sales_email_signatures, if_not_exists: true do |t|
      t.references :user, null: false, foreign_key: true
      t.references :sales_email_account, foreign_key: { to_table: :sales_email_accounts }
      t.string :name, null: false
      t.text :body_html, null: false
      t.boolean :is_default, default: false, null: false
      t.timestamps
    end

    change_table :sales_email_messages, bulk: true do |t|
      t.references :sales_email_account, foreign_key: { to_table: :sales_email_accounts } unless column_exists?(:sales_email_messages, :sales_email_account_id)
      t.references :sales_email_thread, foreign_key: { to_table: :sales_email_threads } unless column_exists?(:sales_email_messages, :sales_email_thread_id)
      t.jsonb :body_json, default: {} unless column_exists?(:sales_email_messages, :body_json)
      t.string :provider_message_id unless column_exists?(:sales_email_messages, :provider_message_id)
      t.string :in_reply_to unless column_exists?(:sales_email_messages, :in_reply_to)
      t.text :references_header unless column_exists?(:sales_email_messages, :references_header)
      t.string :tracking_token unless column_exists?(:sales_email_messages, :tracking_token)
    end

    add_index :sales_email_messages, :tracking_token, unique: true, if_not_exists: true
    add_index :sales_email_messages, :provider_message_id, if_not_exists: true
  end
end
