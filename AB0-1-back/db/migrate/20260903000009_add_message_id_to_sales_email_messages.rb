class AddMessageIdToSalesEmailMessages < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_email_messages, :message_id, :string unless column_exists?(:sales_email_messages, :message_id)
    add_index :sales_email_messages, [:company_id, :message_id], unique: true, where: 'message_id IS NOT NULL', name: 'idx_sales_email_messages_company_message_id' unless index_exists?(:sales_email_messages, [:company_id, :message_id], name: 'idx_sales_email_messages_company_message_id')
  end
end
