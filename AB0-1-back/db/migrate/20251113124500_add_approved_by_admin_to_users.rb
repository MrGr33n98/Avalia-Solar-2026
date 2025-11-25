class AddApprovedByAdminToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :approved_by_admin, :boolean, default: false, null: false
    add_index :users, :approved_by_admin
  end
end
