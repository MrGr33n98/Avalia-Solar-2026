class AddConversionMetricsToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :installation_warranty_years, :integer, default: 1, if_not_exists: true
    add_column :companies, :equipment_brands, :jsonb, default: [], if_not_exists: true
    add_column :companies, :engineering_insurance, :boolean, default: false, if_not_exists: true
    add_column :companies, :post_sales_capacity, :jsonb, default: [], if_not_exists: true
    add_column :companies, :delivered_projects_score, :integer, default: 0, if_not_exists: true
  end
end
