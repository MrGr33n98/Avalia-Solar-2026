class BackfillCompanyRatings < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    say_with_time 'Backfilling company rating aggregates' do
      # Recalculate rating_count and rating_avg based on current reviews
      if postgresql?
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
      else
        # SQLite compatible update (using simple UPDATE FROM syntax supported in recent SQLite or correlated subqueries if needed)
        # SQLite 3.33+ supports UPDATE FROM. Assuming standard dev environment has recent SQLite.
        # If not, would need correlated subqueries. Let's try UPDATE FROM first, but simpler.
        # Actually, simpler is to use Active Record or multiple queries if data is small, but direct SQL is better.
        # Let's use correlated subqueries which are universally supported in SQLite.
        execute <<~SQL
          UPDATE companies 
          SET 
            rating_count = (SELECT COUNT(*) FROM reviews WHERE reviews.company_id = companies.id),
            rating_avg = (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM reviews WHERE reviews.company_id = companies.id)
          WHERE EXISTS (SELECT 1 FROM reviews WHERE reviews.company_id = companies.id);
        SQL
      end

      # Set zero defaults for companies without reviews
      execute <<~SQL
        UPDATE companies SET rating_count = 0, rating_avg = 0 WHERE rating_count IS NULL;
      SQL
    end
  end

  def down
    # No-op: data migration
  end

  private

  def postgresql?
    ActiveRecord::Base.connection.adapter_name =~ /PostgreSQL/i
  end
end
