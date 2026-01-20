class AddSponsoredToArticles < ActiveRecord::Migration[7.0]
  def change
    add_column :articles, :sponsored, :boolean
    add_column :articles, :sponsored_label, :string
  end
end
