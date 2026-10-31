# frozen_string_literal: true

class CreateSalesEmailAssets < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_email_assets do |t|
      t.references :company, null: false, foreign_key: true, index: true
      t.references :uploaded_by, null: false, foreign_key: { to_table: :users }, index: true

      t.string :name, null: false
      t.string :kind, null: false, default: 'other'
      t.string :status, null: false, default: 'pending'
      t.string :alt_text
      t.integer :width_px
      t.integer :height_px
      t.string :mime_type, null: false
      t.bigint :byte_size, null: false
      t.string :checksum_sha256
      t.string :public_url
      t.jsonb :metadata, null: false, default: {}
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :sales_email_assets, %i[company_id status created_at], name: 'index_sales_email_assets_on_tenant_status_date'
    add_index :sales_email_assets, %i[company_id kind], name: 'index_sales_email_assets_on_tenant_kind'
    add_index :sales_email_assets, %i[company_id checksum_sha256], name: 'index_sales_email_assets_on_tenant_checksum'
  end
end
