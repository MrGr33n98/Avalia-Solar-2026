class CreateJoinTableCategoriesProducts < ActiveRecord::Migration[7.0]
  def change
    # Check if join table already exists
    unless table_exists?(:categories_products)
      create_join_table :categories, :products do |t|
        t.index [:category_id, :product_id]
        t.index [:product_id, :category_id]
      end
    end
  end
end
