class AddSharesCountToReviewerPublications < ActiveRecord::Migration[7.0]
  def up
    add_column :reviewer_publications, :shares_count, :bigint, null: false, default: 0 unless column_exists?(:reviewer_publications, :shares_count)

    execute <<~SQL
      UPDATE reviewer_publications
      SET views_count = COALESCE((
        SELECT COUNT(*) FROM reviewer_publication_events
        WHERE reviewer_publication_events.reviewer_publication_id = reviewer_publications.id
          AND reviewer_publication_events.event_name = 'publication_view'
      ), 0),
      shares_count = COALESCE((
        SELECT COUNT(*) FROM reviewer_publication_events
        WHERE reviewer_publication_events.reviewer_publication_id = reviewer_publications.id
          AND reviewer_publication_events.event_name = 'publication_share'
      ), 0)
    SQL
  end

  def down
    remove_column :reviewer_publications, :shares_count if column_exists?(:reviewer_publications, :shares_count)
  end
end
