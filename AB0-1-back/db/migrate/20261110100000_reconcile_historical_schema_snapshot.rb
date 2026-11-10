# frozen_string_literal: true

module DemandActivationSchemaReconciliation
  private

  def create_demand_activation_tables
    create_demand_activation_sources
    create_demand_activation_segments
    create_demand_activation_provider_connections
    create_demand_activation_sync_jobs
    create_demand_activation_audit_events
  end

  def create_demand_activation_sources
    return if table_exists?(:demand_activation_sources)

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
  end

  def create_demand_activation_segments
    unless table_exists?(:demand_activation_audience_segments)
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
    end
    add_index :demand_activation_audience_segments, %i[company_id status],
              name: 'idx_activation_segments_tenant_status', if_not_exists: true
  end

  def create_demand_activation_provider_connections
    return if table_exists?(:demand_activation_provider_connections)

    create_table :demand_activation_provider_connections do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :provider, null: false
      t.string :status, null: false, default: 'not_connected'
      t.string :provider_account_label
      t.timestamps
    end
    add_index :demand_activation_provider_connections, %i[company_id provider],
              unique: true,
              name: 'idx_activation_connections_tenant_provider',
              if_not_exists: true
  end

  def create_demand_activation_sync_jobs
    create_demand_activation_sync_jobs_table unless table_exists?(:demand_activation_sync_jobs)
    add_index :demand_activation_sync_jobs, %i[company_id idempotency_key],
              unique: true,
              name: 'idx_activation_sync_jobs_idempotency',
              if_not_exists: true
  end

  def create_demand_activation_sync_jobs_table
    create_table :demand_activation_sync_jobs do |t|
      t.references :company, null: false, foreign_key: true
      t.references :audience_segment, null: false,
                                      foreign_key: { to_table: :demand_activation_audience_segments },
                                      index: { name: 'idx_activation_sync_jobs_segment' }
      t.references :provider_connection, null: false,
                                         foreign_key: { to_table: :demand_activation_provider_connections },
                                         index: { name: 'idx_activation_sync_jobs_connection' }
      t.string :status, null: false, default: 'pending'
      t.string :idempotency_key, null: false
      t.integer :accepted_count
      t.integer :rejected_count
      t.integer :matched_count
      t.string :error_code
      t.timestamps
    end
  end

  def create_demand_activation_audit_events
    unless table_exists?(:demand_activation_audit_events)
      create_table :demand_activation_audit_events do |t|
        t.references :company, null: false, foreign_key: true
        t.references :actor, null: false, foreign_key: { to_table: :users }
        t.string :action, null: false
        t.string :subject_type, null: false
        t.bigint :subject_id, null: false
        t.timestamps
      end
    end
    add_index :demand_activation_audit_events, %i[company_id created_at],
              name: 'idx_activation_audit_tenant_time', if_not_exists: true
  end
end

class ReconcileHistoricalSchemaSnapshot < ActiveRecord::Migration[7.0]
  include DemandActivationSchemaReconciliation

  def up
    create_sales_quotas
    create_sales_opportunity_installments
    create_sales_pipeline_stage_automations
    create_sales_pipeline_daily_snapshots
    create_sales_contact_methods
    create_sales_email_assets
    create_demand_activation_tables
    create_category_slug_redirects
    reconcile_category_editorial_workflow
  end

  def down
    raise ActiveRecord::IrreversibleMigration, 'A reconciliação pode preservar dados criados após o deploy.'
  end

  private

  def create_sales_quotas
    return if table_exists?(:sales_quotas)

    create_table :sales_quotas do |t|
      t.references :company, foreign_key: true, index: true
      t.references :user, null: false, foreign_key: true, index: true
      t.references :sales_pipeline, foreign_key: true, index: true
      t.string :period_type, null: false, default: 'monthly'
      t.date :starts_on, null: false
      t.date :ends_on, null: false
      t.bigint :target_revenue_cents, null: false, default: 0
      t.integer :target_deals_count, null: false, default: 0
      t.timestamps
    end

    add_index :sales_quotas, %i[user_id starts_on ends_on sales_pipeline_id],
              unique: true, name: 'idx_sales_quotas_user_period_pipeline'
  end

  def create_sales_opportunity_installments
    return if table_exists?(:sales_opportunity_installments)

    create_table :sales_opportunity_installments do |t|
      t.references :sales_opportunity, null: false, foreign_key: true,
                                       index: { name: 'idx_sales_opp_installments_on_opp_id' }
      t.integer :installment_number, null: false, default: 1
      t.date :due_date, null: false
      t.bigint :amount_cents, null: false, default: 0
      t.string :status, null: false, default: 'planned'
      t.datetime :paid_at
      t.text :notes
      t.timestamps
    end

    add_index :sales_opportunity_installments, %i[sales_opportunity_id installment_number],
              unique: true, name: 'idx_sales_opp_installments_unique_number'
    add_index :sales_opportunity_installments, :due_date
    add_index :sales_opportunity_installments, :status
  end

  def create_sales_pipeline_stage_automations
    return if table_exists?(:sales_pipeline_stage_automations)

    create_table :sales_pipeline_stage_automations do |t|
      t.references :sales_stage, null: false, foreign_key: { to_table: :sales_stages },
                                 index: { name: 'idx_stage_automations_on_stage' }
      t.references :sales_email_sequence, null: false,
                                          foreign_key: { to_table: :sales_email_sequences },
                                          index: { name: 'idx_stage_automations_on_seq' }
      t.references :company, null: false, foreign_key: true,
                             index: { name: 'idx_stage_automations_on_company' }
      t.boolean :active, default: true, null: false
      t.string :trigger_type, default: 'on_enter', null: false
      t.timestamps
    end

    add_index :sales_pipeline_stage_automations,
              %i[sales_stage_id sales_email_sequence_id company_id],
              unique: true, name: 'idx_sales_stage_automations_unique_rule'
  end

  def create_sales_pipeline_daily_snapshots
    return if table_exists?(:sales_pipeline_daily_snapshots)

    create_table :sales_pipeline_daily_snapshots do |t|
      t.references :sales_pipeline, null: false, foreign_key: { to_table: :sales_pipelines }
      t.references :company, foreign_key: { to_table: :companies }
      t.references :owner, foreign_key: { to_table: :users }
      t.references :source, foreign_key: { to_table: :sales_sources }
      t.date :snapshot_date, null: false
      t.datetime :captured_at, null: false
      t.integer :open_count, null: false, default: 0
      t.bigint :open_value_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.integer :definition_version, null: false, default: 1
      t.timestamps
    end

    add_daily_snapshot_indexes
  end

  def add_daily_snapshot_indexes
    add_index :sales_pipeline_daily_snapshots, %i[sales_pipeline_id snapshot_date],
              name: 'idx_pipe_snapshots_on_pipeline_and_date'
    add_index :sales_pipeline_daily_snapshots, %i[company_id snapshot_date],
              name: 'idx_pipe_snapshots_on_company_and_date'
    execute <<~SQL
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_snapshots_canonical_unique
      ON sales_pipeline_daily_snapshots (
        sales_pipeline_id,
        COALESCE(company_id, 0),
        COALESCE(owner_id, 0),
        COALESCE(source_id, 0),
        snapshot_date
      );
    SQL
  end

  def create_sales_contact_methods
    create_sales_contact_methods_table unless table_exists?(:sales_contact_methods)
    add_sales_contact_method_indexes
  end

  def create_sales_contact_methods_table
    create_table :sales_contact_methods do |t|
      t.references :company, foreign_key: true, index: true
      t.references :sales_contact, null: false, foreign_key: { to_table: :sales_contacts }, index: true
      t.string :kind, null: false
      t.text :value, null: false
      t.text :normalized_value, null: false
      t.string :label, default: 'Trabalho'
      t.boolean :is_primary, default: false, null: false
      t.integer :position, default: 0, null: false
      t.string :source, default: 'manual', null: false
      t.references :created_by, foreign_key: { to_table: :users }, index: true
      t.references :updated_by, foreign_key: { to_table: :users }, index: true
      t.datetime :archived_at
      t.timestamps
    end
  end

  def add_sales_contact_method_indexes
    add_index :sales_contact_methods, %i[company_id sales_contact_id kind],
              name: 'idx_contact_methods_tenant_contact_kind', if_not_exists: true
    add_index :sales_contact_methods, %i[sales_contact_id kind normalized_value],
              unique: true, where: 'archived_at IS NULL',
              name: 'idx_contact_methods_unique_active', if_not_exists: true
    add_index :sales_contact_methods, %i[sales_contact_id kind],
              unique: true, where: 'is_primary = true AND archived_at IS NULL',
              name: 'idx_contact_methods_single_primary', if_not_exists: true
  end

  def create_sales_email_assets
    return if table_exists?(:sales_email_assets)

    create_sales_email_asset_table
    add_sales_email_asset_indexes
  end

  def add_sales_email_asset_indexes
    add_index :sales_email_assets, %i[company_id status created_at],
              name: 'index_sales_email_assets_on_tenant_status_date'
    add_index :sales_email_assets, %i[company_id kind], name: 'index_sales_email_assets_on_tenant_kind'
    add_index :sales_email_assets, %i[company_id checksum_sha256],
              name: 'index_sales_email_assets_on_tenant_checksum'
  end

  def create_sales_email_asset_table
    create_table :sales_email_assets do |t|
      t.references :company, null: false, foreign_key: true, index: true
      t.references :uploaded_by, null: false, foreign_key: { to_table: :users }, index: true
      t.string :name, null: false
      t.string :kind, null: false, default: 'other'
      t.string :status, null: false, default: 'pending'
      t.string :alt_text
      t.integer :width_px
      t.integer :height_px
      t.string :mime_type, null: false
      t.bigint :byte_size, null: false
      t.string :checksum_sha256
      t.string :public_url
      t.jsonb :metadata, null: false, default: {}
      t.datetime :deleted_at
      t.timestamps
    end
  end

  def create_category_slug_redirects
    unless table_exists?(:category_slug_redirects)
      create_table :category_slug_redirects do |t|
        t.references :category, null: false, foreign_key: { on_delete: :cascade }
        t.string :source_slug, null: false
        t.integer :http_status, null: false, default: 308
        t.string :reason
        t.bigint :created_by_id
        t.timestamps
      end
    end

    add_index :category_slug_redirects, :source_slug,
              unique: true,
              name: 'index_category_slug_redirects_on_source_slug',
              if_not_exists: true
    add_index :category_slug_redirects, %i[category_id created_at],
              name: 'index_category_slug_redirects_on_category_and_created_at',
              if_not_exists: true
  end

  def reconcile_category_editorial_workflow
    add_category_editorial_columns
    create_category_editorial_revisions unless table_exists?(:category_editorial_revisions)
    add_category_editorial_revision_indexes
  end

  def add_category_editorial_columns
    unless column_exists?(:categories, :lock_version)
      add_column :categories, :lock_version, :integer, default: 0, null: false
    end
    unless column_exists?(:categories, :editorial_status)
      add_column :categories, :editorial_status, :string, default: 'published', null: false
    end
    add_column :categories, :published_at, :datetime unless column_exists?(:categories, :published_at)
    add_column :categories, :published_by_id, :bigint unless column_exists?(:categories, :published_by_id)
  end

  def create_category_editorial_revisions
    create_table :category_editorial_revisions do |t|
      t.references :category, null: false, foreign_key: true
      t.integer :version_number, null: false
      t.string :status, null: false, default: 'draft'
      t.jsonb :payload_json, null: false, default: {}
      t.text :source_notes
      t.string :change_reason
      t.bigint :created_by_id
      t.bigint :reviewed_by_id
      t.datetime :published_at
      t.timestamps
    end
  end

  def add_category_editorial_revision_indexes
    add_index :category_editorial_revisions, %i[category_id version_number],
              unique: true,
              name: 'idx_category_editorial_revisions_cat_version',
              if_not_exists: true
    add_index :category_editorial_revisions, %i[category_id status],
              name: 'idx_category_editorial_revisions_cat_status', if_not_exists: true
  end
end
