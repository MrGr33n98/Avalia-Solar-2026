class AddSeoToProducts < ActiveRecord::Migration[7.0]
  def change
    add_column :products, :seo_title, :string unless column_exists?(:products, :seo_title)
    add_column :products, :meta_description, :text unless column_exists?(:products, :meta_description)
  end
end
