# frozen_string_literal: true

class CreateEventPlatformDerivedTables < ActiveRecord::Migration[7.0]
  def up
    is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    json_type = is_pg ? :jsonb : :json

    # Removed Postgres guard to allow SQLite in dev/test
    create_table :event_definitions, id: false, if_not_exists: true do |t|
      t.text :event_type, primary_key: true
      t.integer :schema_version, default: 1, null: false
      t.column :required_keys, json_type, default: '[]', null: false
      t.column :pii_keys, json_type, default: '[]', null: false
      t.column :retention_policy, json_type, default: '{"months": 24}', null: false
      t.boolean :enabled, default: true, null: false
      t.text :description
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end

    create_table :event_ingest_errors, if_not_exists: true do |t|
      t.text :event_id
      t.text :event_type
      t.column :payload, json_type
      t.text :error_reason
      t.datetime :occurred_at, default: -> { 'NOW()' }, null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end
    add_index :event_ingest_errors, :occurred_at unless index_exists?(:event_ingest_errors, :occurred_at)
    add_index :event_ingest_errors, :event_type unless index_exists?(:event_ingest_errors, :event_type)

    create_table :company_feature_daily, id: false, if_not_exists: true do |t|
      t.bigint :company_id, null: false
      t.date :day, null: false
      t.decimal :engagement_score, precision: 10, scale: 4, default: 0
      t.decimal :lead_conversion_rate, precision: 5, scale: 4, default: 0
      t.integer :review_velocity, default: 0
      t.decimal :unique_session_ratio, precision: 5, scale: 4, default: 0
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
    end
    
    if is_pg
      execute "ALTER TABLE company_feature_daily ADD PRIMARY KEY (company_id, day);"
    end

    create_table :company_feature_rolling_30d, id: false, if_not_exists: true do |t|
      t.bigint :company_id, primary_key: true
      t.datetime :computed_at, default: -> { 'NOW()' }, null: false
      t.decimal :avg_engagement, precision: 10, scale: 4, default: 0
      t.integer :total_leads, default: 0
      t.integer :total_views, default: 0
      t.decimal :conversion_trend, precision: 10, scale: 4, default: 0
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end

    create_table :company_trust_score, id: false, if_not_exists: true do |t|
      t.bigint :company_id, primary_key: true
      t.decimal :score, precision: 5, scale: 2, null: false
      t.column :components, json_type, null: false
      t.datetime :computed_at, default: -> { 'NOW()' }, null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end
    
    if is_pg
      execute "ALTER TABLE company_trust_score ADD CONSTRAINT check_trust_score CHECK (score >= 0 AND score <= 100);"
    end
    add_index :company_trust_score, :score, order: { score: :desc } unless index_exists?(:company_trust_score, :score)

    create_table :company_ranking_score, id: false, if_not_exists: true do |t|
      t.bigint :company_id, primary_key: true
      t.decimal :score, precision: 10, scale: 4, null: false
      t.datetime :computed_at, default: -> { 'NOW()' }, null: false
      t.column :breakdown, json_type, default: '{}', null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end
    add_index :company_ranking_score, :score, order: { score: :desc } unless index_exists?(:company_ranking_score, :score)

    create_table :company_anomaly_daily, id: false, if_not_exists: true do |t|
      t.bigint :company_id, null: false
      t.date :day, null: false
      t.text :metric, null: false
      t.decimal :zscore, precision: 8, scale: 4, null: false
      t.boolean :flagged, null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end
    
    if is_pg
      execute "ALTER TABLE company_anomaly_daily ADD PRIMARY KEY (company_id, day, metric);"
    end
    add_index :company_anomaly_daily, [:company_id, :flagged] unless index_exists?(:company_anomaly_daily, [:company_id, :flagged])

    create_table :analytics_processing_state, id: false, if_not_exists: true do |t|
      t.text :pipeline_name, primary_key: true
      t.datetime :last_processed_at, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end

    pipelines = %w[feature_store_daily feature_store_rolling_30d anomaly_daily trust_score ranking_score main_aggregation]
    pipelines.each do |pipeline|
      # SQLite friendly upsert
      execute "INSERT OR IGNORE INTO analytics_processing_state (pipeline_name, last_processed_at) VALUES ('#{pipeline}', '2026-01-01 00:00:00+00')"
    end
  end

  def down
    # Normal down
  end
end
