# frozen_string_literal: true

class CreateSalesImportsAndRows < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_imports, id: :uuid do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.string :entity_type, null: false, default: 'lead'
      t.string :filename, null: false
      t.string :status, null: false, default: 'uploaded'

      t.integer :total_rows, default: 0
      t.integer :processed_rows, default: 0
      t.integer :valid_rows, default: 0
      t.integer :invalid_rows, default: 0
      t.integer :duplicate_rows, default: 0
      t.integer :created_rows, default: 0
      t.integer :updated_rows, default: 0
      t.integer :skipped_rows, default: 0

      t.jsonb :mapping, default: {}
      t.jsonb :options, default: {}
      t.jsonb :error_summary, default: {}

      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :sales_imports, [:company_id, :created_at]
    add_index :sales_imports, [:company_id, :status]

    create_table :sales_import_rows do |t|
      t.references :sales_import, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.integer :row_number, null: false

      t.jsonb :raw_data, default: {}
      t.jsonb :normalized_data, default: {}

      t.string :status, null: false, default: 'pending'
      t.string :fingerprint

      t.jsonb :errors_json, default: []
      t.jsonb :warnings_json, default: []

      t.string :duplicate_type
      t.string :duplicate_record_type
      t.bigint :duplicate_record_id

      t.string :result_record_type
      t.bigint :result_record_id

      t.timestamps
    end

    add_index :sales_import_rows, [:sales_import_id, :row_number], unique: true
    add_index :sales_import_rows, [:sales_import_id, :status]
    add_index :sales_import_rows, [:sales_import_id, :fingerprint]
  end
end
