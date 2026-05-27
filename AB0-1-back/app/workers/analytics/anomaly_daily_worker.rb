# frozen_string_literal: true

module Analytics
  class AnomalyDailyWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :analytics, retry: 1

    PIPELINE = 'anomaly_daily'
    LOCK_ID = Zlib.crc32(PIPELINE)

    def perform(target_date = nil)
      return unless postgresql?

      raw_lock = ActiveRecord::Base.connection.select_value(ActiveRecord::Base.sanitize_sql_array(["SELECT pg_try_advisory_lock(?)", LOCK_ID]))
      return unless ActiveModel::Type::Boolean.new.cast(raw_lock)

      begin
        day = target_date ? Date.parse(target_date) : Date.yesterday
        start_time = Time.current

        rows = recalculate_day(day)
        
        ActiveRecord::Base.connection.exec_query(ActiveRecord::Base.sanitize_sql_array(["UPDATE analytics_processing_state SET last_processed_at = NOW() WHERE pipeline_name = ?", PIPELINE]))
        
        dur = ((Time.current - start_time) * 1000).to_i
        log_run('AnomalyDaily', day.to_s, rows, dur)
      ensure
        ActiveRecord::Base.connection.exec_query(ActiveRecord::Base.sanitize_sql_array(["SELECT pg_advisory_unlock(?)", LOCK_ID]))
      end
    end

    def recalculate_day(day)
      start_ts = day.in_time_zone('UTC').beginning_of_day
      end_ts   = (day + 1.day).in_time_zone('UTC').beginning_of_day

      sql = <<~SQL
        WITH stats AS (
          SELECT 
            company_id, day, profile_views,
            AVG(profile_views) OVER w AS rolling_mean,
            STDDEV(profile_views) OVER w AS rolling_stddev
          FROM company_daily_stats
          WINDOW w AS (PARTITION BY company_id ORDER BY day ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING)
        )
        INSERT INTO company_anomaly_daily (company_id, day, metric, zscore, flagged, created_at, updated_at)
        SELECT 
          company_id, day, 'profile_views',
          CASE WHEN COALESCE(rolling_stddev, 0) > 0 THEN (profile_views - rolling_mean) / rolling_stddev ELSE 0 END,
          CASE WHEN (profile_views - rolling_mean) / NULLIF(rolling_stddev, 0) > 3.0 THEN true ELSE false END,
          NOW(), NOW()
        FROM stats
        WHERE day = $1 AND company_id IS NOT NULL
        ON CONFLICT (company_id, day, metric) DO UPDATE SET zscore = EXCLUDED.zscore, flagged = EXCLUDED.flagged, updated_at = NOW()
        RETURNING 1;
      SQL
      res = ActiveRecord::Base.connection.exec_query(ActiveRecord::Base.sanitize_sql_array([sql, day]))
      res.rows.size
    end

    private

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
