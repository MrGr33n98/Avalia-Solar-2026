# frozen_string_literal: true

class CreateSalesCampaignRecipients < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_campaign_recipients do |t|
      t.bigint :company_id, null: false
      t.bigint :sales_campaign_id, null: false
      t.bigint :sales_contact_id
      t.bigint :sales_account_id
      t.bigint :sales_email_message_id
      t.string :email, null: false
      t.string :first_name
      t.string :status, default: 'pending', null: false
      t.text :error_message
      t.datetime :sent_at
      t.datetime :delivered_at
      t.datetime :opened_at
      t.datetime :clicked_at
      t.datetime :bounced_at
      t.datetime :unsubscribed_at
      t.jsonb :metadata, default: {}, null: false

      t.timestamps
    end

    add_index :sales_campaign_recipients, %i[sales_campaign_id email], unique: true, name: 'idx_campaign_recipients_campaign_email'
    add_index :sales_campaign_recipients, %i[company_id sales_campaign_id status], name: 'idx_campaign_recipients_status'
    add_index :sales_campaign_recipients, :sales_contact_id, name: 'idx_campaign_recipients_contact'
    add_index :sales_campaign_recipients, :sales_email_message_id, name: 'idx_campaign_recipients_email_msg'
  end
end
