class AddFieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :featured, :boolean, default: false
    add_column :companies, :verified, :boolean, default: false
    add_column :companies, :rating_cache, :decimal, precision: 3, scale: 1
    add_column :companies, :reviews_count, :integer, default: 0
  end
end