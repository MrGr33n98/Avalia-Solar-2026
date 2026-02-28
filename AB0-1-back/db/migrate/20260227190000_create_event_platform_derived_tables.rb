# frozen_string_literal: true

class CreateEventPlatformDerivedTables < ActiveRecord::Migration[7.0]
  def up
    return unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    create_table :event_definitions, id: false do |t|
      t.text :event_type, primary_key: true
      t.integer :schema_version, default: 1, null: false
      t.jsonb :required_keys, default: '[]', null: false
      t.jsonb :pii_keys, default: '[]', null: false
      t.jsonb :retention_policy, default: '{"months": 24}', null: false
      t.boolean :enabled, default: true, null: false
      t.text :description
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end

    create_table :event_ingest_errors do |t|
      t.text :event_id
      t.text :event_type
      t.jsonb :payload
      t.text :error_reason
      t.datetime :occurred_at, default: -> { 'NOW()' }, null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end
    add_index :event_ingest_errors, :occurred_at
    add_index :event_ingest_errors, :event_type

    create_table :company_feature_daily, id: false do |t|
      t.bigint :company_id, null: false
      t.date :day, null: false
      t.decimal :engagement_score, precision: 10, scale: 4, default: 0
      t.decimal :lead_conversion_rate, precision: 5, scale: 4, default: 0
      t.integer :review_velocity, default: 0
      t.decimal :unique_session_ratio, precision: 5, scale: 4, default: 0
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
    end
    execute "ALTER TABLE company_feature_daily ADD PRIMARY KEY (company_id, day);"

    create_table :company_feature_rolling_30d, id: false do |t|
      t.bigint :company_id, primary_key: true
      t.datetime :computed_at, default: -> { 'NOW()' }, null: false
      t.decimal :avg_engagement, precision: 10, scale: 4, default: 0
      t.integer :total_leads, default: 0
      t.integer :total_views, default: 0
      t.decimal :conversion_trend, precision: 10, scale: 4, default: 0
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end

    create_table :company_trust_score, id: false do |t|
      t.bigint :company_id, primary_key: true
      t.decimal :score, precision: 5, scale: 2, null: false
      t.jsonb :components, null: false
      t.datetime :computed_at, default: -> { 'NOW()' }, null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end
    execute "ALTER TABLE company_trust_score ADD CONSTRAINT check_trust_score CHECK (score >= 0 AND score <= 100);"
    add_index :company_trust_score, :score, order: { score: :desc }

    create_table :company_ranking_score, id: false do |t|
      t.bigint :company_id, primary_key: true
      t.decimal :score, precision: 10, scale: 4, null: false
      t.datetime :computed_at, default: -> { 'NOW()' }, null: false
      t.jsonb :breakdown, default: '{}', null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end
    add_index :company_ranking_score, :score, order: { score: :desc }

    create_table :company_anomaly_daily, id: false do |t|
      t.bigint :company_id, null: false
      t.date :day, null: false
      t.text :metric, null: false
      t.decimal :zscore, precision: 8, scale: 4, null: false
      t.boolean :flagged, null: false
      t.datetime :created_at, default: -> { 'NOW()' }, null: false
      t.datetime :updated_at, default: -> { 'NOW()' }, null: false
    end
    execute "ALTER TABLE company_anomaly_daily ADD PRIMARY KEY (company_id, day, metric);"
    add_index :company_anomaly_daily, [:company_id, :flagged]

    pipelines = %w[feature_store_daily feature_store_rolling_30d anomaly_daily trust_score ranking_score main_aggregation]
    pipelines.each do |pipeline|
      sql = "INSERT INTO analytics_processing_state (pipeline_name, last_processed_at) VALUES ($1, '2026-01-01 00:00:00+00') ON CONFLICT DO NOTHING"
      ActiveRecord::Base.connection.exec_query(sql, 'SeedState', [[nil, pipeline]])
    end
    
    events = [
      ['profile_view', '["company_id"]', '["ip", "user_agent"]'],
      ['cta_click', '["company_id"]', '["ip", "user_agent"]'],
      ['whatsapp_click', '["company_id"]', '["ip", "user_agent"]'],
      ['lead_created', '["company_id"]', '["ip", "user_agent", "email"]'],
      ['review_created', '["company_id"]', '["ip", "user_agent"]']
    ]
    
    events.each do |e|
      sql = "INSERT INTO event_definitions (event_type, required_keys, pii_keys) VALUES ($1, $2::jsonb, $3::jsonb) ON CONFLICT DO NOTHING"
      ActiveRecord::Base.connection.exec_query(sql, 'SeedRegistry', [[nil, e[0]], [nil, e[1]], [nil, e[2]]])
    end
  end

  def down
    return unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    drop_table :company_anomaly_daily
    drop_table :company_ranking_score
    drop_table :company_trust_score
    drop_table :company_feature_rolling_30d
    drop_table :company_feature_daily
    drop_table :event_ingest_errors
    drop_table :event_definitions
    
    ActiveRecord::Base.connection.execute("DELETE FROM analytics_processing_state WHERE pipeline_name IN ('feature_store_daily', 'feature_store_rolling_30d', 'anomaly_daily', 'trust_score', 'ranking_score', 'main_aggregation')")
  end
end
