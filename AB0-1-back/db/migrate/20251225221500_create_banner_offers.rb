class CreateBannerOffers < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_offers do |t|
      t.string :name, null: false
      t.integer :price_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.integer :duration_days, null: false, default: 30
      t.jsonb :rules_json, null: false, default: {}
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    add_index :banner_offers, :active
  end
end
