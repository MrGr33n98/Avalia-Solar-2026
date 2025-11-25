class AddLocationToCompanies < ActiveRecord::Migration[7.0]
  def change
    # Check if columns exist before adding them
    unless column_exists?(:companies, :state)
      add_column :companies, :state, :string
    end
    
    unless column_exists?(:companies, :city)
      add_column :companies, :city, :string
    end
  end
end