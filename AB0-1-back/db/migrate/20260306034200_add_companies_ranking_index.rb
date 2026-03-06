class AddCompaniesRankingIndex < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    execute <<-SQL
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_ranking 
      ON companies (status, rating_avg DESC, reviews_count DESC)
    SQL
  end

  def down
    execute <<-SQL
      DROP INDEX CONCURRENTLY IF EXISTS idx_companies_ranking
    SQL
  end
end
