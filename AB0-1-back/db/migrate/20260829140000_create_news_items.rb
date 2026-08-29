class CreateNewsItems < ActiveRecord::Migration[7.0]
  def change
    create_table :news_items do |t|
      t.string :title, null: false
      t.text :summary, null: false
      t.string :source_name, null: false
      t.string :source_url
      t.string :category
      t.integer :reading_time_minutes, null: false, default: 3
      t.datetime :published_at, null: false
      t.boolean :published, null: false, default: false
      t.timestamps
    end
    add_index :news_items, %i[published published_at]
  end
end
