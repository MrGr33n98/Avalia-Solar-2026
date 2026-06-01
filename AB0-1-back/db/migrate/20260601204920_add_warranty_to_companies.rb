class AddWarrantyToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :warranty_years, :integer
    add_column :companies, :post_sales_support, :boolean
  end
end
