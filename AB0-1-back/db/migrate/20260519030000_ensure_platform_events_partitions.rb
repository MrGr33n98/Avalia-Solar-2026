# frozen_string_literal: true

class EnsurePlatformEventsPartitions < ActiveRecord::Migration[7.0]
  def up
    return unless postgresql?
    return unless table_exists?(:platform_events)
    return unless platform_events_partitioned?

    execute <<~SQL
      CREATE OR REPLACE FUNCTION create_platform_events_partition(target_date timestamptz)
      RETURNS text AS $$
      DECLARE
          start_date timestamptz := date_trunc('month', target_date);
          end_date timestamptz := start_date + interval '1 month';
          partition_name text := 'platform_events_y' || to_char(start_date, 'YYYY') || 'm' || to_char(start_date, 'MM');
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE c.relname = partition_name
              AND n.nspname = ANY(current_schemas(false))
          ) THEN
              EXECUTE format('CREATE TABLE %I PARTITION OF platform_events FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
              RETURN partition_name;
          END IF;
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      SELECT create_platform_events_partition(date_trunc('month', now()) + (gs.month_offset * interval '1 month'))
      FROM generate_series(-1, 6) AS gs(month_offset);
    SQL
  end

  def down
    # Intentionally keep partitions and maintenance function. Dropping them can
    # make analytics ingestion fail for already-deployed application versions.
  end

  private

  def postgresql?
    ActiveRecord::Base.connection.adapter_name.match?(/postgre/i)
  end

  def platform_events_partitioned?
    ActiveRecord::Base.connection.select_value(
      "SELECT EXISTS(SELECT 1 FROM pg_partitioned_table WHERE partrelid = 'platform_events'::regclass)"
    )
  rescue ActiveRecord::StatementInvalid
    false
  end
end
