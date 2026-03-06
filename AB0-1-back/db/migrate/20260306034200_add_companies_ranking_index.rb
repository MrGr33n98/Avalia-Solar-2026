class AddCompaniesRankingIndex < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :companies, 
      [:status, :rating_avg, :reviews_count], 
      name: 'idx_companies_ranking',
      algorithm: :concurrently,
      if_not_exists: true
  end
end
