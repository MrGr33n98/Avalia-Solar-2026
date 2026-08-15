class HardenReviewerPublications < ActiveRecord::Migration[7.0]
  def change
    add_column :reviewer_publications, :moderation_status, :string, null: false, default: 'approved' unless column_exists?(:reviewer_publications, :moderation_status)
    add_column :reviewer_publications, :views_count, :bigint, null: false, default: 0 unless column_exists?(:reviewer_publications, :views_count)
    add_index :reviewer_publications, %i[status published_at] unless index_exists?(:reviewer_publications, %i[status published_at])
    add_index :reviewer_publications, %i[user_id published_at], where: "status = 'published'", name: 'idx_reviewer_publications_user_published' unless index_exists?(:reviewer_publications, %i[user_id published_at], name: 'idx_reviewer_publications_user_published')
  end
end
