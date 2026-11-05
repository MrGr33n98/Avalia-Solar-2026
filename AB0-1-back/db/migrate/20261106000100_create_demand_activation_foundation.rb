# frozen_string_literal: true

# Customer-facing Intent Sync. Deliberately independent of internal Sales CRM.
# No raw personal identifiers or OAuth credentials are stored by this migration.
class CreateDemandActivationFoundation < ActiveRecord::Migration[7.0]
  def change
    create_table :demand_activation_sources do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false, limit: 120
      t.string :kind, null: false, default: 'company_first_party'
      t.string :verification_status, null: false, default: 'pending'
      t.boolean :active, null: false, default: false
      t.jsonb :provenance, null: false, default: {}
      t.timestamps
    end

    create_table :demand_activation_audience_segments do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :source, foreign_key: { to_table: :demand_activation_sources }
      t.string :name, null: false, limit: 120
      t.string :status, null: false, default: 'draft'
      t.jsonb :filter_definition, null: false, default: {}
      t.integer :version, null: false, default: 1
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :demand_activation_audience_segments, [:company_id, :status], name: 'idx_activation_segments_tenant_status'

    create_table :demand_activation_provider_connections do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :provider, null: false
      t.string :status, null: false, default: 'not_connected'
      t.string :provider_account_label
      t.timestamps
    end
    add_index :demand_activation_provider_connections, [:company_id, :provider], unique: true, name: 'idx_activation_connections_tenant_provider'

    create_table :demand_activation_sync_jobs do |t|
      t.references :company, null: false, foreign_key: true
      t.references :audience_segment, null: false, foreign_key: { to_table: :demand_activation_audience_segments }, index: { name: 'idx_activation_sync_jobs_segment' }
      t.references :provider_connection, null: false, foreign_key: { to_table: :demand_activation_provider_connections }, index: { name: 'idx_activation_sync_jobs_connection' }
      t.string :status, null: false, default: 'pending'
      t.string :idempotency_key, null: false
      t.integer :accepted_count
      t.integer :rejected_count
      t.integer :matched_count
      t.string :error_code
      t.timestamps
    end
    add_index :demand_activation_sync_jobs, [:company_id, :idempotency_key], unique: true, name: 'idx_activation_sync_jobs_idempotency'

    create_table :demand_activation_audit_events do |t|
      t.references :company, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.string :subject_type, null: false
      t.bigint :subject_id, null: false
      t.timestamps
    end
    add_index :demand_activation_audit_events, [:company_id, :created_at], name: 'idx_activation_audit_tenant_time'
  end
end
