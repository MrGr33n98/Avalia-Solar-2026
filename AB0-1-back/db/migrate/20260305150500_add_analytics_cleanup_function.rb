# frozen_string_literal: true

class AddAnalyticsCleanupFunction < ActiveRecord::Migration[7.0]
  def up
    # Create SQL function for cleaning up old analytics events
    execute <<-SQL
      CREATE OR REPLACE FUNCTION cleanup_analytics_events()
      RETURNS TABLE(
        deleted_events BIGINT,
        deleted_dedupe BIGINT,
        duration_seconds NUMERIC
      ) AS $$
      DECLARE
        start_time TIMESTAMP;
        end_time TIMESTAMP;
        v_deleted_events BIGINT := 0;
        v_deleted_dedupe BIGINT;
        v_deleted_temp BIGINT;
      BEGIN
        start_time := clock_timestamp();
        
        -- 1. Delete old events (except leads and critical conversions)
        DELETE FROM analytics_events
        WHERE tracked_at < CURRENT_DATE - INTERVAL '180 days'
          AND event_type NOT IN ('lead_submitted', 'lead_verified', 'purchase');
        
        GET DIAGNOSTICS v_deleted_temp = ROW_COUNT;
        v_deleted_events := v_deleted_events + v_deleted_temp;
        
        -- 2. Delete very old leads (2+ years)
        DELETE FROM analytics_events
        WHERE tracked_at < CURRENT_DATE - INTERVAL '2 years'
          AND event_type IN ('lead_submitted', 'lead_verified', 'purchase');
        
        GET DIAGNOSTICS v_deleted_temp = ROW_COUNT;
        v_deleted_events := v_deleted_events + v_deleted_temp;
        
        -- 3. Delete old dedupe entries
        DELETE FROM analytics_event_dedup
        WHERE inserted_at < CURRENT_DATE - INTERVAL '30 days';
        
        GET DIAGNOSTICS v_deleted_dedupe = ROW_COUNT;
        
        -- 4. Vacuum to reclaim space (advisory lock to prevent conflicts)
        PERFORM pg_catalog.pg_advisory_lock(1);
        VACUUM ANALYZE analytics_events;
        VACUUM ANALYZE analytics_event_dedup;
        PERFORM pg_catalog.pg_advisory_unlock(1);
        
        end_time := clock_timestamp();
        
        RETURN QUERY SELECT 
          v_deleted_events,
          v_deleted_dedupe,
          EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC;
      END;
      $$ LANGUAGE plpgsql;
    SQL
  end
  
  def down
    execute "DROP FUNCTION IF EXISTS cleanup_analytics_events();"
  end
end
