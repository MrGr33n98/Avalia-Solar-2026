class AddFieldsToCompaniesV3 < ActiveRecord::Migration[7.0]
  def change
    # Check if columns exist before adding them to prevent duplicates
    unless column_exists?(:companies, :featured)
      add_column :companies, :featured, :boolean, default: false
    end
    
    unless column_exists?(:companies, :verified)
      add_column :companies, :verified, :boolean, default: false
    end
    
    unless column_exists?(:companies, :rating_cache)
      add_column :companies, :rating_cache, :decimal, precision: 3, scale: 1
    end
    
    unless column_exists?(:companies, :reviews_count)
      add_column :companies, :reviews_count, :integer, default: 0
    end
  end
end