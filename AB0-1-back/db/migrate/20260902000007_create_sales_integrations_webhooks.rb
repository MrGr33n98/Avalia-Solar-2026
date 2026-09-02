class CreateSalesIntegrationsWebhooks < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_integrations do |t|
      t.references :company, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :provider, null: false
      t.string :name, null: false
      t.string :status, null: false, default: 'active'
      t.jsonb :settings, null: false, default: {}
      t.datetime :last_synced_at
      t.timestamps
    end

    create_table :sales_webhook_endpoints do |t|
      t.references :company, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :url, null: false
      t.string :secret_digest, null: false
      t.jsonb :events, null: false, default: []
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    create_table :sales_webhook_deliveries do |t|
      t.references :endpoint, null: false, foreign_key: { to_table: :sales_webhook_endpoints }
      t.string :event_type, null: false
      t.string :idempotency_key, null: false
      t.integer :status_code
      t.integer :attempts, null: false, default: 0
      t.string :status, null: false, default: 'pending'
      t.text :response_body
      t.datetime :delivered_at
      t.timestamps
    end
    add_index :sales_webhook_deliveries, :idempotency_key, unique: true
  end
end
