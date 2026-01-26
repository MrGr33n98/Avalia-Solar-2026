class AddIndexToCategoriesParentId < ActiveRecord::Migration[7.0]
  def change
    add_index :categories, :parent_id unless index_exists?(:categories, :parent_id)
  end
end

