# frozen_string_literal: true

class AddApprovedAtToReviews < ActiveRecord::Migration[7.0]
  def up
    unless column_exists?(:reviews, :approved_at)
      add_column :reviews, :approved_at, :datetime
    end

    unless index_exists?(:reviews, %i[status approved_at], name: 'index_reviews_on_status_and_approved_at')
      add_index :reviews, %i[status approved_at], name: 'index_reviews_on_status_and_approved_at'
    end

    # Safe backfill for existing approved reviews (status: 1 is approved)
    execute <<-SQL.squish
      UPDATE reviews
      SET approved_at = updated_at
      WHERE status = 1 AND approved_at IS NULL
    SQL
  end

  def down
    if index_name_exists?(:reviews, 'index_reviews_on_status_and_approved_at')
      remove_index :reviews, name: 'index_reviews_on_status_and_approved_at'
    end

    if column_exists?(:reviews, :approved_at)
      remove_column :reviews, :approved_at
    end
  end
end
