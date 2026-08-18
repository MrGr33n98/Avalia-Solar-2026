class CreateFavorites < ActiveRecord::Migration[7.0]
  def change
    create_table :favorites do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.string :favoritable_type, null: false
      t.bigint :favoritable_id, null: false
      t.timestamps
    end

    add_index :favorites, %i[user_id favoritable_type favoritable_id],
              unique: true, name: 'idx_favorites_unique_user_item'
    add_index :favorites, %i[favoritable_type favoritable_id], name: 'idx_favorites_favoritable'
    add_index :favorites, %i[user_id created_at], name: 'idx_favorites_user_created_at'
  end
end
