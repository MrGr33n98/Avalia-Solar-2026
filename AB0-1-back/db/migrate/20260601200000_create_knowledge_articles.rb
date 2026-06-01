class CreateKnowledgeArticles < ActiveRecord::Migration[7.0]
  def change
    create_table :knowledge_articles do |t|
      t.string :title, null: false
      t.string :slug, null: false
      t.text :content, null: false
      t.references :category, null: false, foreign_key: true
      t.string :status, default: 'published', null: false
      t.datetime :published_at

      t.timestamps
    end

    add_index :knowledge_articles, :slug, unique: true
    add_index :knowledge_articles, :status
  end
end
