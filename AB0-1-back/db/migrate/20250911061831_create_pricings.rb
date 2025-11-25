class CreatePricings < ActiveRecord::Migration[7.0]
  def change
    create_table :pricings do |t|
      t.references :product, null: false, foreign_key: true
      t.string :title
      t.string :currency
      t.decimal :value
      t.string :charge_type
      t.string :frequency
      t.string :payment_methods
      t.integer :display_order
      t.integer :discount
      t.string :state

      t.timestamps
    end
  end
end
