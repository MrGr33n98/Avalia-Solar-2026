class AddAuthorToArticles < ActiveRecord::Migration[7.0]
  def change
    add_reference :articles, :author, foreign_key: { to_table: :admin_users }, null: true
  end
end
