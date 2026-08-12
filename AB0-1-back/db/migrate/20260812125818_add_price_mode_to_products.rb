class AddPriceModeToProducts < ActiveRecord::Migration[7.0]
  def change
    add_column :products, :price_mode, :string, default: "fixed", null: false
  end
end
