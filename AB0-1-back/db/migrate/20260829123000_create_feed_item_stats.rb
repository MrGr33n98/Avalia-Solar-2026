class CreateFeedItemStats < ActiveRecord::Migration[7.0]
  def change
    create_table :feed_item_stats do |t|
      t.string :subject_type, null: false
      t.bigint :subject_id, null: false
      t.bigint :reactions_count, null: false, default: 0
      t.bigint :comments_count, null: false, default: 0
      t.bigint :saves_count, null: false, default: 0
      t.bigint :shares_count, null: false, default: 0
      t.bigint :views_count, null: false, default: 0
      t.decimal :engagement_score, precision: 12, scale: 4, null: false, default: 0
      t.datetime :last_engagement_at
      t.timestamps
    end

    add_index :feed_item_stats, %i[subject_type subject_id], unique: true
    add_index :feed_item_stats, :engagement_score

    execute <<~SQL
      INSERT INTO feed_item_stats (subject_type, subject_id, reactions_count, comments_count, saves_count, shares_count, views_count, engagement_score, created_at, updated_at)
      SELECT subject_type, subject_id, reactions_count, comments_count, saves_count, shares_count, views_count,
             reactions_count + comments_count * 3 + saves_count * 4 + shares_count * 5,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM (
        SELECT COALESCE(r.subject_type, c.subject_type, s.subject_type) AS subject_type,
               COALESCE(r.subject_id, c.subject_id, s.subject_id) AS subject_id,
               COALESCE(r.reactions_count, 0) AS reactions_count,
               COALESCE(c.comments_count, 0) AS comments_count,
               COALESCE(s.saves_count, 0) AS saves_count,
               0 AS shares_count, 0 AS views_count
        FROM (SELECT reactable_type subject_type, reactable_id subject_id, COUNT(*) reactions_count FROM reactions GROUP BY 1, 2) r
        FULL OUTER JOIN (SELECT commentable_type subject_type, commentable_id subject_id, COUNT(*) comments_count FROM comments WHERE status = 'active' GROUP BY 1, 2) c USING (subject_type, subject_id)
        FULL OUTER JOIN (SELECT saveable_type subject_type, saveable_id subject_id, COUNT(*) saves_count FROM saved_items GROUP BY 1, 2) s USING (subject_type, subject_id)
      ) counters
    SQL

    execute <<~SQL
      UPDATE feed_item_stats stats
      SET views_count = events.views_count,
          shares_count = events.shares_count,
          engagement_score = stats.engagement_score + events.shares_count * 5,
          last_engagement_at = CURRENT_TIMESTAMP
      FROM (
        SELECT reviewer_publication_id,
               COUNT(*) FILTER (WHERE event_name = 'publication_view') AS views_count,
               COUNT(*) FILTER (WHERE event_name = 'publication_share') AS shares_count
        FROM reviewer_publication_events
        GROUP BY reviewer_publication_id
      ) events
      WHERE stats.subject_type = 'ReviewerPublication'
        AND stats.subject_id = events.reviewer_publication_id
    SQL
  end
end
