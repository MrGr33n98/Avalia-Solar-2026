class CreateSalesV3Foundation < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_taxonomies do |t|
      t.references :company, foreign_key: true
      t.string :kind, null: false
      t.string :name, null: false
      t.string :slug, null: false
      t.boolean :active, null: false, default: true
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :sales_taxonomies, %i[company_id kind slug], unique: true

    create_table :sales_custom_field_definitions do |t|
      t.references :company, foreign_key: true
      t.string :entity_type, null: false
      t.string :key, null: false
      t.string :label, null: false
      t.string :field_type, null: false
      t.boolean :required, null: false, default: false
      t.integer :position, null: false, default: 0
      t.jsonb :options, null: false, default: []
      t.timestamps
    end
    add_index :sales_custom_field_definitions, %i[company_id entity_type key], unique: true, name: 'idx_sales_custom_fields_key'

    create_table :sales_custom_field_values do |t|
      t.references :definition, null: false, foreign_key: { to_table: :sales_custom_field_definitions }
      t.string :entity_type, null: false
      t.bigint :entity_id, null: false
      t.text :value
      t.timestamps
    end
    add_index :sales_custom_field_values, %i[definition_id entity_type entity_id], unique: true, name: 'idx_sales_custom_field_values_unique'

    create_table :sales_notes do |t|
      t.references :company, foreign_key: true
      t.references :account, foreign_key: { to_table: :sales_accounts }
      t.references :opportunity, foreign_key: { to_table: :sales_opportunities }
      t.references :contact, foreign_key: { to_table: :sales_contacts }
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.string :title
      t.text :body, null: false
      t.boolean :pinned, null: false, default: false
      t.timestamps
    end
    add_index :sales_notes, %i[account_id created_at]

    create_table :sales_audit_logs do |t|
      t.references :company, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.string :auditable_type, null: false
      t.bigint :auditable_id, null: false
      t.jsonb :changeset, null: false, default: {}
      t.string :request_id
      t.inet :ip
      t.timestamps
    end
    add_index :sales_audit_logs, %i[auditable_type auditable_id]

    create_table :sales_api_keys do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, foreign_key: true
      t.string :name, null: false
      t.string :key_prefix, null: false
      t.string :key_digest, null: false
      t.jsonb :scopes, null: false, default: []
      t.datetime :last_used_at
      t.datetime :revoked_at
      t.timestamps
    end
    add_index :sales_api_keys, :key_digest, unique: true

    create_table :sales_products do |t|
      t.references :company, foreign_key: true
      t.string :sku, null: false
      t.string :name, null: false
      t.text :description
      t.integer :unit_price_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :sales_products, %i[company_id sku], unique: true

    create_table :sales_opportunity_line_items do |t|
      t.references :opportunity, null: false, foreign_key: { to_table: :sales_opportunities }
      t.references :product, null: false, foreign_key: { to_table: :sales_products }
      t.decimal :quantity, null: false, default: 1, precision: 12, scale: 3
      t.integer :unit_price_cents, null: false
      t.integer :discount_cents, null: false, default: 0
      t.timestamps
    end

    create_table :sales_energy_profiles do |t|
      t.references :account, null: false, foreign_key: { to_table: :sales_accounts }
      t.decimal :monthly_consumption_kwh, precision: 12, scale: 2
      t.decimal :tariff_brl_per_kwh, precision: 10, scale: 4
      t.string :utility
      t.string :connection_type
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    create_table :sales_solar_projects do |t|
      t.references :account, null: false, foreign_key: { to_table: :sales_accounts }
      t.references :opportunity, foreign_key: { to_table: :sales_opportunities }
      t.string :status, null: false, default: 'qualification'
      t.decimal :system_kwp, precision: 12, scale: 3
      t.decimal :estimated_generation_kwh, precision: 14, scale: 2
      t.integer :estimated_cost_cents
      t.integer :version, null: false, default: 1
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :sales_tracking_events do |t|
      t.references :account, foreign_key: { to_table: :sales_accounts }
      t.references :contact, foreign_key: { to_table: :sales_contacts }
      t.string :session_id, null: false
      t.string :event_name, null: false
      t.string :path
      t.jsonb :properties, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.timestamps
    end
    add_index :sales_tracking_events, %i[session_id occurred_at]
  end
end
