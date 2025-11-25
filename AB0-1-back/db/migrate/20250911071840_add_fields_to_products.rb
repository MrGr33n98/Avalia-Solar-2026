class AddFieldsToProducts < ActiveRecord::Migration[7.0]
  def change
    add_column :products, :short_description, :text
    add_column :products, :sku, :string
    add_column :products, :stock, :integer
    add_column :products, :status, :string
    add_column :products, :featured, :boolean
    add_column :products, :seo_title, :string
    add_column :products, :seo_description, :text
  end
end
