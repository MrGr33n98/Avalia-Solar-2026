# frozen_string_literal: true

class CreateSalesContactMethods < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_contact_methods, if_not_exists: true do |t|
      t.references :company, foreign_key: true, index: true
      t.references :sales_contact, null: false, foreign_key: { to_table: :sales_contacts }, index: true
      t.string :kind, null: false
      t.text :value, null: false
      t.text :normalized_value, null: false
      t.string :label, default: 'Trabalho'
      t.boolean :is_primary, default: false, null: false
      t.integer :position, default: 0, null: false
      t.string :source, default: 'manual', null: false
      t.references :created_by, foreign_key: { to_table: :users }, index: true
      t.references :updated_by, foreign_key: { to_table: :users }, index: true
      t.datetime :archived_at

      t.timestamps
    end

    unless index_exists?(:sales_contact_methods, %i[company_id sales_contact_id kind], name: 'idx_contact_methods_tenant_contact_kind')
      add_index :sales_contact_methods,
                %i[company_id sales_contact_id kind],
                name: 'idx_contact_methods_tenant_contact_kind'
    end

    unless index_exists?(:sales_contact_methods, %i[sales_contact_id kind normalized_value], name: 'idx_contact_methods_unique_active')
      add_index :sales_contact_methods,
                %i[sales_contact_id kind normalized_value],
                unique: true,
                where: 'archived_at IS NULL',
                name: 'idx_contact_methods_unique_active'
    end

    unless index_exists?(:sales_contact_methods, %i[sales_contact_id kind], name: 'idx_contact_methods_single_primary')
      add_index :sales_contact_methods,
                %i[sales_contact_id kind],
                unique: true,
                where: 'is_primary = true AND archived_at IS NULL',
                name: 'idx_contact_methods_single_primary'
    end
  end
end
