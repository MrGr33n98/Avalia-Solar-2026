class AddIndicesToCompaniesForPerformance < ActiveRecord::Migration[7.0]
  def change
    add_column :companies_for_performances, :status, :string
    add_index :companies_for_performances, :status
    add_column :companies_for_performances, :featured, :string
    add_index :companies_for_performances, :featured
    add_column :companies_for_performances, :verified, :string
    add_index :companies_for_performances, :verified
  end
end
