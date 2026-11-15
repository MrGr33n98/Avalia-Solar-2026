# frozen_string_literal: true

class CreateSalesWhatsappCrmFoundation < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_whatsapp_threads do |t|
      t.references :company, null: false, foreign_key: true
      t.references :sales_account, foreign_key: { to_table: :sales_accounts }
      t.references :sales_contact, foreign_key: { to_table: :sales_contacts }
      t.string :provider, null: false, default: 'waha'
      t.string :provider_session, null: false, default: ''
      t.string :contact_hash, null: false, limit: 64
      t.string :status, null: false, default: 'open'
      t.string :last_intent
      t.datetime :last_message_at
      t.timestamps
    end
    add_index :sales_whatsapp_threads,
              %i[company_id provider provider_session contact_hash],
              unique: true, name: 'idx_sales_whatsapp_thread_identity'
    add_index :sales_whatsapp_threads, %i[company_id last_message_at],
              name: 'idx_sales_whatsapp_thread_recent'

    create_table :sales_whatsapp_messages do |t|
      t.references :sales_whatsapp_thread, null: false, foreign_key: true,
                   index: { name: 'idx_sales_whatsapp_messages_thread' }
      t.string :provider_message_id, null: false
      t.string :direction, null: false, default: 'inbound'
      t.string :message_type, null: false
      t.string :intent, null: false
      t.datetime :occurred_at, null: false
      t.timestamps
    end
    add_index :sales_whatsapp_messages, %i[sales_whatsapp_thread_id provider_message_id],
              unique: true, name: 'idx_sales_whatsapp_messages_dedupe'
  end
end
