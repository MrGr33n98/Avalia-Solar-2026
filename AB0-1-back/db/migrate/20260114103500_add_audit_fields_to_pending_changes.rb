class AddAuditFieldsToPendingChanges < ActiveRecord::Migration[7.0]
  def change
    add_column :pending_changes, :approved_ip, :string
    add_column :pending_changes, :approved_user_agent, :string
    add_column :pending_changes, :rejected_ip, :string
    add_column :pending_changes, :rejected_user_agent, :string
  end
end
