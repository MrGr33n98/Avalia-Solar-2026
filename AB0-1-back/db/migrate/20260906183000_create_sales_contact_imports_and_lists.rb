# frozen_string_literal: true

class CreateSalesContactImportsAndLists < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_contact_imports do |t|
      t.bigint :company_id, null: false
      t.bigint :user_id, null: false
      t.string :filename, null: false
      t.string :status, null: false, default: 'uploaded'
      t.integer :total_rows, default: 0
      t.integer :valid_rows, default: 0
      t.integer :invalid_rows, default: 0
      t.integer :duplicate_rows, default: 0
      t.integer :imported_rows, default: 0
      t.integer :failed_rows, default: 0
      t.jsonb :mapping_jsonb, default: {}
      t.jsonb :options_jsonb, default: {}
      t.jsonb :error_summary_jsonb, default: {}
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :sales_contact_imports, :company_id
    add_index :sales_contact_imports, :user_id
    add_index :sales_contact_imports, %i[company_id status]

    create_table :sales_contact_lists do |t|
      t.bigint :company_id, null: false
      t.bigint :created_by_id
      t.string :name, null: false
      t.text :description
      t.string :kind, null: false, default: 'static'
      t.boolean :active, null: false, default: true
      t.integer :contacts_count, default: 0, null: false

      t.timestamps
    end

    add_index :sales_contact_lists, :company_id
    add_index :sales_contact_lists, %i[company_id active]

    create_table :sales_contact_list_memberships do |t|
      t.bigint :company_id, null: false
      t.bigint :sales_contact_list_id, null: false
      t.bigint :sales_contact_id, null: false
      t.string :source, default: 'manual'
      t.datetime :created_at, null: false
    end

    add_index :sales_contact_list_memberships, :company_id
    add_index :sales_contact_list_memberships, :sales_contact_list_id
    add_index :sales_contact_list_memberships, :sales_contact_id
    add_index :sales_contact_list_memberships,
              %i[sales_contact_list_id sales_contact_id],
              unique: true,
              name: 'idx_sales_contact_list_memberships_unique'
  end
end
