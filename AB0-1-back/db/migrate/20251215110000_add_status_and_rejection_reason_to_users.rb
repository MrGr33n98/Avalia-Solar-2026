class AddStatusAndRejectionReasonToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :status, :integer, default: 0
    add_column :users, :rejection_reason, :text
    add_index :users, :status
    
    # Migrate existing data
    User.reset_column_information
    User.where(approved_by_admin: true).update_all(status: 1) # active
    User.where(approved_by_admin: false).update_all(status: 0) # pending
  end
end
