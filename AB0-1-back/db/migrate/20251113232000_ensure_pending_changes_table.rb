class EnsurePendingChangesTable < ActiveRecord::Migration[7.0]
  def up
    return if table_exists?(:pending_changes)

    create_table :pending_changes do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.references :approved_by, foreign_key: { to_table: :admin_users }

      t.string :change_type, null: false
      if ActiveRecord::Base.connection.adapter_name =~ /SQLite/i
        t.json :data, default: {}
      else
        t.jsonb :data, default: {}
      end
      t.string :status, default: 'pending'
      t.text :rejection_reason

      t.datetime :approved_at
      t.datetime :rejected_at
      t.datetime :applied_at

      t.timestamps
    end

    add_index :pending_changes, :change_type
    add_index :pending_changes, :status
    add_index :pending_changes, [:company_id, :status]
  end

  def down
    drop_table :pending_changes, if_exists: true
  end
end

