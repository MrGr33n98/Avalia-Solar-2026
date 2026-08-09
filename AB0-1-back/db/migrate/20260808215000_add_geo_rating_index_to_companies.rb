class AddGeoRatingIndexToCompanies < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :companies, [:state, :city, :rating_avg], algorithm: :concurrently, name: 'idx_companies_geo_rating'
  end
end
