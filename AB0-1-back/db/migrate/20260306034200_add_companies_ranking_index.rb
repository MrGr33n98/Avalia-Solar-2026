class AddCompaniesRankingIndex < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    add_index :companies, 
      [:status, :rating_avg, :reviews_count], 
      name: 'idx_companies_ranking',
      algorithm: :concurrently,
      if_not_exists: true
  end

  def down
    remove_index :companies, name: 'idx_companies_ranking', if_exists: true
  end
end
