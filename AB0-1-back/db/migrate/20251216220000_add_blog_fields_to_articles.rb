class AddBlogFieldsToArticles < ActiveRecord::Migration[7.0]
  def change
    add_column :articles, :slug, :string
    add_column :articles, :excerpt, :text
    add_column :articles, :meta_title, :string
    add_column :articles, :meta_description, :string
    add_column :articles, :published_at, :datetime
    add_column :articles, :status, :string
    add_column :articles, :featured, :boolean
    add_column :articles, :views_count, :integer
    
    add_index :articles, :slug
    
    # Relax constraints
    change_column_null :articles, :product_id, true
  end
end
