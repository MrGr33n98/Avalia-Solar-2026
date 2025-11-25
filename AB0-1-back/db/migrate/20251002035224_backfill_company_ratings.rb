class BackfillCompanyRatings < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    say_with_time 'Backfilling company rating aggregates' do
      # Recalculate rating_count and rating_avg based on current reviews
      execute <<~SQL
        UPDATE companies c SET 
          rating_count = sub.count,
          rating_avg = COALESCE(sub.avg, 0)
        FROM (
          SELECT company_id, COUNT(*) AS count, ROUND(AVG(rating)::numeric, 2) AS avg
          FROM reviews
          GROUP BY company_id
        ) sub
        WHERE c.id = sub.company_id;
      SQL

      # Set zero defaults for companies without reviews
      execute <<~SQL
        UPDATE companies SET rating_count = 0, rating_avg = 0 WHERE rating_count IS NULL;
      SQL
    end
  end

  def down
    # No-op: data migration
  end
end
