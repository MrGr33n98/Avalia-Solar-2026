class CreateSalesV3RevenueAttribution < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_quotes do |t|
      t.references :opportunity, null: false, foreign_key: { to_table: :sales_opportunities }
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :number, null: false
      t.string :status, null: false, default: 'draft'
      t.date :expires_on
      t.integer :total_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.datetime :sent_at
      t.datetime :accepted_at
      t.timestamps
    end
    add_index :sales_quotes, :number, unique: true

    create_table :sales_quote_items do |t|
      t.references :quote, null: false, foreign_key: { to_table: :sales_quotes }
      t.references :product, foreign_key: { to_table: :sales_products }
      t.string :description, null: false
      t.decimal :quantity, null: false, default: 1, precision: 12, scale: 3
      t.integer :unit_price_cents, null: false
      t.integer :total_cents, null: false
      t.timestamps
    end

    create_table :sales_quote_events do |t|
      t.references :quote, null: false, foreign_key: { to_table: :sales_quotes }
      t.references :actor, foreign_key: { to_table: :users }
      t.string :event_type, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :sales_campaigns do |t|
      t.references :company, foreign_key: true
      t.string :name, null: false
      t.string :source
      t.string :medium
      t.string :campaign_key, null: false
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :sales_campaigns, %i[company_id campaign_key], unique: true

    create_table :sales_consents do |t|
      t.references :contact, null: false, foreign_key: { to_table: :sales_contacts }
      t.string :purpose, null: false
      t.string :lawful_basis, null: false
      t.boolean :granted, null: false, default: false
      t.datetime :granted_at
      t.datetime :revoked_at
      t.datetime :expires_at
      t.string :source
      t.timestamps
    end
    add_index :sales_consents, %i[contact_id purpose], unique: true
  end
end
