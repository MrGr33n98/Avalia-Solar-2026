class AddCreatorPerformanceIndexes < ActiveRecord::Migration[7.0]
  def change
    add_index :reviewer_publications, %i[user_id status published_at], name: 'idx_reviewer_publications_public_feed'
    add_index :creator_leads, %i[creator_user_id status created_at], name: 'idx_creator_leads_inbox'
    add_index :reviewer_publication_comments, %i[reviewer_publication_id status created_at], name: 'idx_creator_comments_feed'
  end
end
