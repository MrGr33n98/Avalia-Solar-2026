# This migration adds idempotency_key support to prevent duplicate pending changes
class AddIdempotencyKeyToPendingChanges < ActiveRecord::Migration[7.1]
  def change
    add_column :pending_changes, :idempotency_key, :string, null: true unless column_exists?(:pending_changes, :idempotency_key)
    
    # Create unique index to prevent duplicates
    unless index_exists?(:pending_changes, [:company_id, :idempotency_key])
      add_index :pending_changes, [:company_id, :idempotency_key], 
                unique: true, 
                where: "status = 'pending'",
                name: 'idx_pending_changes_idempotency_active'
    end
    
    # Index for audit trail
    unless index_exists?(:pending_changes, :idempotency_key, name: 'idx_pending_changes_idempotency_key')
      add_index :pending_changes, :idempotency_key, name: 'idx_pending_changes_idempotency_key'
    end
  end
end
