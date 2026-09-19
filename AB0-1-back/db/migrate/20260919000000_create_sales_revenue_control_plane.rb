# frozen_string_literal: true

class CreateSalesRevenueControlPlane < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_research_records do |t|
      t.bigint :company_id, null: false
      t.bigint :sales_account_id
      t.bigint :sales_contact_id
      t.bigint :sales_opportunity_id
      t.string :agent_id
      t.bigint :created_by_id
      t.string :kind, null: false
      t.string :certainty, null: false, default: 'unverified'
      t.string :source, null: false
      t.string :source_identifier
      t.string :source_url
      t.datetime :collected_at, null: false
      t.datetime :verified_at
      t.decimal :confidence, precision: 5, scale: 4
      t.string :raw_reference_version
      t.string :raw_reference_digest
      t.string :idempotency_key
      t.jsonb :content, null: false, default: {}
      t.timestamps
    end

    add_index :sales_research_records, :company_id
    add_index :sales_research_records, :sales_account_id
    add_index :sales_research_records, :sales_contact_id
    add_index :sales_research_records, :sales_opportunity_id
    add_index :sales_research_records, :agent_id
    add_index :sales_research_records, %i[company_id kind collected_at], name: 'idx_sales_research_kind_time'
    add_index :sales_research_records,
              %i[company_id idempotency_key],
              unique: true,
              where: 'idempotency_key IS NOT NULL',
              name: 'idx_sales_research_records_idempotency'

    create_table :sales_founder_inbox_items do |t|
      t.bigint :company_id, null: false
      t.bigint :sales_account_id
      t.bigint :sales_opportunity_id
      t.bigint :mcp_approval_request_id
      t.string :agent_id
      t.string :kind, null: false
      t.string :status, null: false, default: 'open'
      t.string :title, null: false
      t.text :why, null: false
      t.jsonb :evidence, null: false, default: []
      t.string :recommended_action, null: false
      t.string :risk_tier, null: false, default: 'r0'
      t.boolean :approval_required, null: false, default: false
      t.string :dedupe_key, null: false
      t.jsonb :action_payload, null: false, default: {}
      t.datetime :observed_at, null: false
      t.datetime :resolved_at
      t.timestamps
    end

    add_index :sales_founder_inbox_items, :company_id
    add_index :sales_founder_inbox_items, :sales_account_id
    add_index :sales_founder_inbox_items, :sales_opportunity_id
    add_index :sales_founder_inbox_items, :mcp_approval_request_id
    add_index :sales_founder_inbox_items, :agent_id
    add_index :sales_founder_inbox_items, %i[company_id status observed_at],
              name: 'idx_sales_founder_inbox_items_queue'
    add_index :sales_founder_inbox_items, %i[company_id dedupe_key], unique: true,
                                                                     name: 'idx_sales_founder_inbox_items_dedupe'

    add_column :sales_tasks, :idempotency_key, :string
    add_index :sales_tasks,
              %i[sales_account_id idempotency_key],
              unique: true,
              where: 'idempotency_key IS NOT NULL',
              name: 'idx_sales_tasks_idempotency'

    add_foreign_key :sales_research_records, :companies
    add_foreign_key :sales_research_records, :sales_accounts, column: :sales_account_id
    add_foreign_key :sales_research_records, :sales_contacts, column: :sales_contact_id
    add_foreign_key :sales_research_records, :sales_opportunities, column: :sales_opportunity_id
    add_foreign_key :sales_research_records, :users, column: :created_by_id
    add_foreign_key :sales_founder_inbox_items, :companies
    add_foreign_key :sales_founder_inbox_items, :sales_accounts, column: :sales_account_id
    add_foreign_key :sales_founder_inbox_items, :sales_opportunities, column: :sales_opportunity_id
    add_foreign_key :sales_founder_inbox_items, :mcp_approval_requests
  end
end
