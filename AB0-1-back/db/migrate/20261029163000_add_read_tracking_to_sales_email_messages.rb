# frozen_string_literal: true

class AddReadTrackingToSalesEmailMessages < ActiveRecord::Migration[7.0]
  def change
    change_table :sales_email_messages, bulk: true do |t|
      t.boolean :is_read, default: false, null: false unless column_exists?(:sales_email_messages, :is_read)
      t.datetime :read_at unless column_exists?(:sales_email_messages, :read_at)
    end

    unless index_exists?(:sales_email_messages, %i[sales_email_account_id is_read], name: 'idx_sales_email_messages_account_is_read')
      add_index :sales_email_messages,
                %i[sales_email_account_id is_read],
                name: 'idx_sales_email_messages_account_is_read'
    end
  end
end
