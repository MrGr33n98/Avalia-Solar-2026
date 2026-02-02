class CreateProductPriceHistories < ActiveRecord::Migration[7.0]
  def change
    return if table_exists?(:product_price_histories)

    create_table :product_price_histories do |t|
      t.references :product, null: false, foreign_key: true
      t.decimal :price, precision: 12, scale: 2, null: false
      t.datetime :recorded_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.json :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :product_price_histories, [:product_id, :recorded_at], name: :idx_product_price_histories_product_time
  end
end
