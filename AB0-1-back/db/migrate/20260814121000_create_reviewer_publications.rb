class CreateReviewerPublications < ActiveRecord::Migration[7.0]
  def change
    create_table :reviewer_publications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.string :slug, null: false
      t.text :excerpt
      t.text :body, null: false
      t.string :status, null: false, default: 'draft'
      t.string :publication_type, null: false, default: 'article'
      t.string :category
      t.datetime :published_at
      t.boolean :comments_enabled, null: false, default: true
      t.boolean :lead_capture_enabled, null: false, default: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :reviewer_publications, %i[user_id slug], unique: true
    add_index :reviewer_publications, %i[user_id status]
  end
end
