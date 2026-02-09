class AddFinancingTabVisibleToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :financing_tab_visible, :boolean, default: false, null: false
  end
end
