class AddSalesAccountLookupIndexes < ActiveRecord::Migration[7.0]
  def change
    add_index :sales_accounts, %i[company_id name], name: 'idx_sales_accounts_company_name'
    add_index :sales_accounts, %i[owner_id name], name: 'idx_sales_accounts_owner_name'
  end
end
