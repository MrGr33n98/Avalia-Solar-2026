# frozen_string_literal: true

class AddAnalyticsContractV3 < ActiveRecord::Migration[7.0]
  EVENT_REQUIREMENTS = {
    'profile_view' => %w[company_id surface_kind],
    'cta_click' => %w[company_id cta_type surface_kind],
    'quote_contact_submitted' => %w[company_id],
    'lead_created' => %w[company_id lead_id correlation_id],
    'company_activated' => %w[company_id correlation_id],
    'subscription_activated' => %w[company_id correlation_id],
    'invoice_paid' => %w[company_id correlation_id]
  }.freeze

  def up
    unless column_exists?(:analytics_event_dedup, :occurrence_key)
      add_column :analytics_event_dedup, :occurrence_key, :text
    end
    add_index :analytics_event_dedup, :occurrence_key, unique: true,
              name: 'idx_analytics_event_dedup_occurrence_key',
              where: 'occurrence_key IS NOT NULL' unless index_exists?(:analytics_event_dedup, :occurrence_key,
                                                                       name: 'idx_analytics_event_dedup_occurrence_key')

    %i[correlation_id occurrence_key producer environment surface consent_analytics event_origin].each do |column|
      add_column :platform_events, column, :text unless column_exists?(:platform_events, column)
    end

    add_index :platform_events, %i[company_id event_type occurred_at], name: 'idx_platform_events_company_type_time',
              if_not_exists: true
    seed_event_requirements
  end

  def down
    remove_index :platform_events, name: 'idx_platform_events_company_type_time', if_exists: true
    %i[correlation_id occurrence_key producer environment surface consent_analytics event_origin].each do |column|
      remove_column :platform_events, column if column_exists?(:platform_events, column)
    end
    remove_index :analytics_event_dedup, name: 'idx_analytics_event_dedup_occurrence_key', if_exists: true
    remove_column :analytics_event_dedup, :occurrence_key if column_exists?(:analytics_event_dedup, :occurrence_key)
  end

  private

  def seed_event_requirements
    return unless table_exists?(:event_definitions)

    EVENT_REQUIREMENTS.each do |event_type, required_keys|
      quoted_event = connection.quote(event_type)
      quoted_keys = connection.quote(required_keys.to_json)
      if connection.adapter_name.match?(/postgres/i)
        execute <<~SQL.squish
          INSERT INTO event_definitions (event_type, schema_version, required_keys, description, enabled, created_at,
                                         updated_at)
          VALUES (#{quoted_event}, 3, #{quoted_keys}::jsonb, 'analytics_contract_v3', TRUE, CURRENT_TIMESTAMP,
                  CURRENT_TIMESTAMP)
          ON CONFLICT (event_type) DO UPDATE SET schema_version = 3, required_keys = #{quoted_keys}::jsonb,
            description = 'analytics_contract_v3', updated_at = CURRENT_TIMESTAMP
        SQL
      else
        execute <<~SQL.squish
          INSERT OR REPLACE INTO event_definitions (event_type, schema_version, required_keys, description, enabled,
                                                    created_at, updated_at)
          VALUES (#{quoted_event}, 3, #{quoted_keys}, 'analytics_contract_v3', 1, CURRENT_TIMESTAMP,
                  CURRENT_TIMESTAMP)
        SQL
      end
    end
  end
end
