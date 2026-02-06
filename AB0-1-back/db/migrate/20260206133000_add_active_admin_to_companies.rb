class AddActiveAdminToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :active_admin, :boolean, default: false, null: false
  end
end
