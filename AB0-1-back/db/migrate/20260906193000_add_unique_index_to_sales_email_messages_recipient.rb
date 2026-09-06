# frozen_string_literal: true

# PREFLIGHT READ-ONLY AUDIT QUERY (Run manually before applying migration in production):
#
#   SELECT sales_campaign_recipient_id, COUNT(*)
#   FROM sales_email_messages
#   WHERE sales_campaign_recipient_id IS NOT NULL
#   GROUP BY sales_campaign_recipient_id
#   HAVING COUNT(*) > 1;
#
# If duplicates exist, resolve them manually prior to running this migration.
# No automatic data destruction is performed by this migration.

class AddUniqueIndexToSalesEmailMessagesRecipient < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    # 1. Create partial UNIQUE index concurrently without blocking writes
    unless index_name_exists?(:sales_email_messages, 'idx_sales_email_messages_recipient_unique')
      add_index :sales_email_messages,
                :sales_campaign_recipient_id,
                unique: true,
                where: 'sales_campaign_recipient_id IS NOT NULL',
                name: 'idx_sales_email_messages_recipient_unique',
                algorithm: :concurrently
    end

    # 2. Safely remove non-unique legacy index after the new UNIQUE index is guaranteed to exist
    if index_name_exists?(:sales_email_messages, 'idx_sales_email_messages_recipient')
      remove_index :sales_email_messages,
                   name: 'idx_sales_email_messages_recipient',
                   algorithm: :concurrently
    end
  end
end
