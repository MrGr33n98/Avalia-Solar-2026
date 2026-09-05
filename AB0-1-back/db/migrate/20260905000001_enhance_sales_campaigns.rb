# frozen_string_literal: true

class EnhanceSalesCampaigns < ActiveRecord::Migration[7.0]
  def change
    change_table :sales_campaigns, bulk: true do |t|
      t.string :status, default: 'draft', null: false
      t.string :campaign_type, default: 'email_broadcast', null: false
      t.jsonb :audience_filter, default: {}, null: false
      t.datetime :scheduled_at
      t.datetime :started_at
      t.datetime :completed_at
      t.integer :total_recipients, default: 0, null: false
      t.integer :processed_recipients, default: 0, null: false
      t.integer :sent_count, default: 0, null: false
      t.integer :delivered_count, default: 0, null: false
      t.integer :opened_count, default: 0, null: false
      t.integer :clicked_count, default: 0, null: false
      t.integer :bounced_count, default: 0, null: false
      t.integer :unsubscribed_count, default: 0, null: false
      t.bigint :revenue_attributed_cents, default: 0, null: false
      t.bigint :email_template_id
      t.bigint :user_id
    end

    add_index :sales_campaigns, %i[company_id status], name: 'idx_sales_campaigns_company_status'
    add_index :sales_campaigns, %i[company_id campaign_type], name: 'idx_sales_campaigns_company_type'
    add_index :sales_campaigns, :email_template_id, name: 'idx_sales_campaigns_email_template_id'
    add_index :sales_campaigns, :user_id, name: 'idx_sales_campaigns_user_id'
  end
end
