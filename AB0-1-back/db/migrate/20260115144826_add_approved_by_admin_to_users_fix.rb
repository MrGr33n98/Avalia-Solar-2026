class AddApprovedByAdminToUsersFix < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :approved_by_admin, :boolean, default: false, null: false
  end
end
