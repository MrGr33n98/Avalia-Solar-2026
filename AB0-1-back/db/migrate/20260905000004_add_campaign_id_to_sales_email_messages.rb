# frozen_string_literal: true

class AddCampaignIdToSalesEmailMessages < ActiveRecord::Migration[7.0]
  def change
    change_table :sales_email_messages, bulk: true do |t|
      t.bigint :sales_campaign_id
      t.bigint :sales_campaign_recipient_id
    end

    add_index :sales_email_messages, :sales_campaign_id, name: 'idx_sales_email_messages_campaign'
    add_index :sales_email_messages, :sales_campaign_recipient_id, name: 'idx_sales_email_messages_recipient'
  end
end
