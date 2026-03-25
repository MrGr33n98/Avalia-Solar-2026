class AddIndicesToCompaniesForPerformance < ActiveRecord::Migration[7.0]
  def change
    add_index :companies, :status unless index_exists?(:companies, :status)
    add_index :companies, :featured unless index_exists?(:companies, :featured)
    add_index :companies, :verified unless index_exists?(:companies, :verified)
  end
end
