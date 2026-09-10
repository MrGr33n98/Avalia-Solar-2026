# frozen_string_literal: true

class RemoveUniqueIndexOnSalesAccountsCompanyId < ActiveRecord::Migration[7.0]
  def change
    remove_index :sales_accounts, name: :index_sales_accounts_on_company_id, if_exists: true
    add_index :sales_accounts, :company_id, name: :index_sales_accounts_on_company_id, if_not_exists: true
  end
end
