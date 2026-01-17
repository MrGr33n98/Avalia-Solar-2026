class AddPriceAndViewsToCategories < ActiveRecord::Migration[7.0]
  def change
    add_column :categories, :average_price, :decimal, precision: 10, scale: 2, default: 0.0
    add_column :categories, :views_count, :integer, default: 0

    add_index :categories, :average_price
    add_index :categories, :views_count
  end
end
