# This migration adds idempotency_key support to prevent duplicate pending changes
class AddIdempotencyKeyToPendingChanges < ActiveRecord::Migration[8.0]
  def change
    add_column :pending_changes, :idempotency_key, :string, null: true
    
    # Create unique index to prevent duplicates
    add_index :pending_changes, [:company_id, :idempotency_key], 
              unique: true, 
              where: "status = 'pending'",
              name: 'idx_pending_changes_idempotency_active'
    
    # Index for audit trail
    add_index :pending_changes, :idempotency_key, name: 'idx_pending_changes_idempotency_key'
  end
end
