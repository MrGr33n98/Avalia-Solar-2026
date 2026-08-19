class CreateDomainEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :domain_events do |t|
      t.string :event_type, null: false
      t.string :aggregate_type, null: false
      t.bigint :aggregate_id, null: false
      t.jsonb :payload, null: false, default: {}
      t.string :status, null: false, default: 'pending'
      t.datetime :occurred_at, null: false
      t.datetime :processed_at
      t.integer :attempts, null: false, default: 0
      t.text :last_error

      t.timestamps
    end

    add_index :domain_events, :status
    add_index :domain_events, [:aggregate_type, :aggregate_id]
    add_index :domain_events, :occurred_at
  end
end
