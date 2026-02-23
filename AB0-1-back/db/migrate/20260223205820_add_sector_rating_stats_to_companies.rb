class AddSectorRatingStatsToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :sector_rating_avg, :decimal, precision: 4, scale: 2, default: 0.0, null: false
    add_column :companies, :sector_rating_count, :integer, default: 0, null: false
  end
end
