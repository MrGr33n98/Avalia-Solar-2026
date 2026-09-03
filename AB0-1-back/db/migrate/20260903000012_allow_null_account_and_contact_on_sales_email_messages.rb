# frozen_string_literal: true

class AllowNullAccountAndContactOnSalesEmailMessages < ActiveRecord::Migration[7.0]
  def change
    change_column_null :sales_email_messages, :sales_account_id, true
    change_column_null :sales_email_messages, :sales_contact_id, true
  end
end
