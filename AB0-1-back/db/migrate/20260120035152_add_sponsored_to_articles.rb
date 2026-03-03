class AddSponsoredToArticles < ActiveRecord::Migration[7.0]
  def change
    add_column :articles, :sponsored, :boolean unless column_exists?(:articles, :sponsored)
    add_column :articles, :sponsored_label, :string unless column_exists?(:articles, :sponsored_label)
  end
end
