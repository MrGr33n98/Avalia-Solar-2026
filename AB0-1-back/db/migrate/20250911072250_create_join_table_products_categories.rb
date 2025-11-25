class CreateJoinTableProductsCategories < ActiveRecord::Migration[7.0]
  def change
    # Check if join table already exists (regardless of name order)
    unless table_exists?(:categories_products) || table_exists?(:products_categories)
      create_join_table :products, :categories do |t|
        t.index [:product_id, :category_id]
        t.index [:category_id, :product_id]
      end
    end
  end
end
