class CreateBannerAddons < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_addons do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.text :description
      t.integer :price_cents, default: 0, null: false
      t.integer :promotional_price_cents
      t.string :currency, default: "BRL", null: false
      t.integer :duration_days, default: 30, null: false
      t.string :category
      t.jsonb :benefits, default: [], null: false
      t.jsonb :rules, default: {}, null: false
      t.boolean :is_active, default: true, null: false
      t.boolean :stackable, default: false, null: false
      t.boolean :automatic_application, default: false, null: false
      t.integer :priority_boost, default: 0, null: false

      t.timestamps
    end
    
    add_index :banner_addons, :code, unique: true
    add_index :banner_addons, :is_active
    add_index :banner_addons, :category
  end
end
