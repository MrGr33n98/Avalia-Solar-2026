class AddIndicesToCompaniesForPerformance < ActiveRecord::Migration[7.0]
  def change
    add_index :companies, :status
    add_index :companies, :featured
    add_index :companies, :verified
  end
end
