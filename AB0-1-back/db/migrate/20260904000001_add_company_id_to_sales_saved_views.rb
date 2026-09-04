class AddCompanyIdToSalesSavedViews < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_saved_views, :company_id, :bigint
    add_index :sales_saved_views, %i[company_id resource_type], name: 'idx_sales_saved_views_company_resource'
  end
end
