class AddMetricsToCategories < ActiveRecord::Migration[7.0]
  def change
    add_column :categories, :companies_count, :integer, default: 0
    add_column :categories, :products_count, :integer, default: 0
    add_column :categories, :average_rating, :decimal, precision: 3, scale: 2, default: 0.0
    
    add_index :categories, :companies_count
    add_index :categories, :average_rating
  end
end
