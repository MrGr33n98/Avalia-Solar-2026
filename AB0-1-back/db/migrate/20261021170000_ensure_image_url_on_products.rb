class EnsureImageUrlOnProducts < ActiveRecord::Migration[7.0]
  def up
    add_column :products, :image_url, :string unless column_exists?(:products, :image_url)
  end

  def down
    remove_column :products, :image_url if column_exists?(:products, :image_url)
  end
end
