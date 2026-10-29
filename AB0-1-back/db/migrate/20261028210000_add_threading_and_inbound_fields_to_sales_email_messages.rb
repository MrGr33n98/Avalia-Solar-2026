# frozen_string_literal: true

class AddThreadingAndInboundFieldsToSalesEmailMessages < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_email_messages, :parent_email_message_id, :bigint unless column_exists?(:sales_email_messages, :parent_email_message_id)
    add_column :sales_email_messages, :reply_mailbox_id, :bigint unless column_exists?(:sales_email_messages, :reply_mailbox_id)
    add_column :sales_email_messages, :reply_to_email, :string unless column_exists?(:sales_email_messages, :reply_to_email)
    add_column :sales_email_messages, :transport_provider, :string unless column_exists?(:sales_email_messages, :transport_provider)
    add_column :sales_email_messages, :rfc_message_id, :string unless column_exists?(:sales_email_messages, :rfc_message_id)
    add_column :sales_email_messages, :in_reply_to_header, :string unless column_exists?(:sales_email_messages, :in_reply_to_header)
    add_column :sales_email_messages, :references_header, :text unless column_exists?(:sales_email_messages, :references_header)
    add_column :sales_email_messages, :inbound_classification, :string, default: 'human_reply' unless column_exists?(:sales_email_messages, :inbound_classification)
    add_column :sales_email_messages, :classification_reason, :jsonb, default: {} unless column_exists?(:sales_email_messages, :classification_reason)

    add_index :sales_email_messages, :parent_email_message_id unless index_exists?(:sales_email_messages, :parent_email_message_id)
    add_index :sales_email_messages, :reply_mailbox_id unless index_exists?(:sales_email_messages, :reply_mailbox_id)
    add_index :sales_email_messages, [:company_id, :rfc_message_id], name: 'idx_sales_email_messages_company_rfc_id' unless index_exists?(:sales_email_messages, [:company_id, :rfc_message_id], name: 'idx_sales_email_messages_company_rfc_id')
    add_index :sales_email_messages, [:company_id, :in_reply_to_header], name: 'idx_sales_email_messages_company_in_reply_to' unless index_exists?(:sales_email_messages, [:company_id, :in_reply_to_header], name: 'idx_sales_email_messages_company_in_reply_to')
  end
end
