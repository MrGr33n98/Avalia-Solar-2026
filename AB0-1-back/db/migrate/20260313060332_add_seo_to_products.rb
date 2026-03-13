class AddSeoToProducts < ActiveRecord::Migration[7.0]
  def change
    add_column :products, :seo_title, :string
    add_column :products, :meta_description, :text
  end
end
