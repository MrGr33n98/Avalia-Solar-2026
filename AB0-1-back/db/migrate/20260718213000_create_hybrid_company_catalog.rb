class CreateHybridCompanyCatalog < ActiveRecord::Migration[7.0]
  def up
    change_column_null :products, :company_id, true

    create_table :company_products do |t|
      t.references :company, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.string :relationship_type, null: false, default: 'catalog_owner'
      t.string :status, null: false, default: 'active'
      t.boolean :authorized, null: false, default: false
      t.jsonb :territories, null: false, default: []
      t.timestamps
    end
    add_index :company_products, %i[company_id product_id], unique: true
    add_index :company_products, %i[company_id status]

    create_table :product_offers do |t|
      t.references :company_product, null: false, foreign_key: true
      t.decimal :price, precision: 12, scale: 2
      t.integer :stock
      t.integer :lead_time_days
      t.boolean :installation_available, null: false, default: false
      t.jsonb :coverage, null: false, default: []
      t.text :commercial_terms
      t.string :status, null: false, default: 'active'
      t.timestamps
    end
    add_index :product_offers, %i[company_product_id status]

    create_table :company_services do |t|
      t.references :company, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.decimal :price_from, precision: 12, scale: 2
      t.jsonb :coverage, null: false, default: []
      t.string :status, null: false, default: 'active'
      t.timestamps
    end
    add_index :company_services, %i[company_id slug], unique: true
    add_index :company_services, %i[company_id category_id status], name: 'idx_company_services_context'

    execute <<~SQL.squish
      INSERT INTO company_products
        (company_id, product_id, relationship_type, status, authorized, territories, created_at, updated_at)
      SELECT company_id, id, 'catalog_owner', 'active', false, '[]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM products
      WHERE company_id IS NOT NULL
      ON CONFLICT (company_id, product_id) DO NOTHING
    SQL
  end

  def down
    drop_table :company_services
    drop_table :product_offers
    drop_table :company_products
    change_column_null :products, :company_id, false
  end
end
