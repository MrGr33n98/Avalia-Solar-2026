class AddMissingSeoDescriptionFields < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :seo_description, :text unless column_exists?(:companies, :seo_description)
    add_column :articles, :seo_title, :string unless column_exists?(:articles, :seo_title)
    add_column :articles, :seo_description, :text unless column_exists?(:articles, :seo_description)
  end
end
