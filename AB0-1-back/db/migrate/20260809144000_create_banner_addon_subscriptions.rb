class CreateBannerAddonSubscriptions < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_addon_subscriptions do |t|
      t.references :company, null: false, foreign_key: true
      t.references :banner, null: true, foreign_key: true
      t.references :banner_addon, null: false, foreign_key: true
      
      t.bigint :legacy_source_id
      t.string :legacy_migration_status
      
      t.integer :price_paid_cents, null: false
      t.integer :discount_cents, default: 0, null: false
      
      t.datetime :starts_at
      t.datetime :ends_at
      
      t.string :status, default: "pending_payment", null: false
      t.string :payment_provider
      t.string :payment_reference
      
      t.datetime :activated_at
      t.datetime :cancelled_at
      
      t.jsonb :addon_snapshot, default: {}, null: false

      t.timestamps
    end
    
    add_index :banner_addon_subscriptions, :status
    add_index :banner_addon_subscriptions, :ends_at
    add_index :banner_addon_subscriptions, :payment_reference
    
    add_check_constraint :banner_addon_subscriptions, "ends_at > starts_at", name: "ck_banner_addon_subs_valid_dates"
  end
end
