class AddUniqueIndexToCompanyVideos < ActiveRecord::Migration[7.0]
  INDEX_NAME = 'idx_company_videos_unique_provider_video'.freeze

  def up
    # Prefer a published row, then keep the oldest duplicate. This migration
    # runs on databases that may already contain duplicates created before the
    # unique constraint existed, so adding the index directly would fail deploy.
    execute <<~SQL.squish
      DELETE FROM company_videos AS duplicate
      USING company_videos AS canonical
      WHERE duplicate.company_id = canonical.company_id
        AND duplicate.provider = canonical.provider
        AND duplicate.video_id = canonical.video_id
        AND (
          (canonical.status = 'published' AND duplicate.status <> 'published')
          OR (canonical.status = duplicate.status AND duplicate.id > canonical.id)
        )
    SQL

    add_index :company_videos,
              %i[company_id provider video_id],
              unique: true,
              name: INDEX_NAME unless index_exists?(:company_videos, %i[company_id provider video_id], name: INDEX_NAME)
  end

  def down
    remove_index :company_videos, name: INDEX_NAME if index_exists?(:company_videos, name: INDEX_NAME)
  end
end
