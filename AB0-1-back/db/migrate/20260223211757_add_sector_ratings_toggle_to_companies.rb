class AddSectorRatingsToggleToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :sector_ratings_enabled, :boolean, default: false, null: false
  end
end
