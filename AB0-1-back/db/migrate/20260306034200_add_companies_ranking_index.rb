class AddCompaniesRankingIndex < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :companies, 
      [:active, :category_id, :rating_avg, :reviews_count], 
      name: 'idx_companies_ranking',
      algorithm: :concurrently
  end
end
