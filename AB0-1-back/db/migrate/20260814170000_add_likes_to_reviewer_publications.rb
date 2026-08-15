class AddLikesToReviewerPublications < ActiveRecord::Migration[7.0]
  def change
    add_column :reviewer_publications, :likes_count, :integer, null: false, default: 0
    create_table :reviewer_publication_likes do |t|
      t.references :reviewer_publication, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :visitor_key
      t.timestamps
    end
    add_index :reviewer_publication_likes, [:reviewer_publication_id, :user_id], unique: true, name: 'idx_publication_likes_user'
    add_index :reviewer_publication_likes, [:reviewer_publication_id, :visitor_key], unique: true, name: 'idx_publication_likes_visitor', where: 'visitor_key IS NOT NULL'
  end
end
