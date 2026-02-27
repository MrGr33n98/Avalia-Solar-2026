# frozen_string_literal: true

module Analytics
  class FeatureStoreDailyWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :analytics, retry: 1

    SAFETY_LAG = 10.minutes
    PIPELINE = 'feature_store_daily'
    LOCK_ID = Zlib.crc32(PIPELINE)

    def perform
      return unless postgresql?

      raw_lock = ActiveRecord::Base.connection.select_value("SELECT pg_try_advisory_lock($1)", 'Lock', [[nil, LOCK_ID]])
      return unless ActiveModel::Type::Boolean.new.cast(raw_lock)

      begin
        start_time = Time.current
        watermark = get_watermark
        window_start = watermark.to_time.in_time_zone('UTC').to_date
        window_end   = (Time.current - SAFETY_LAG).in_time_zone('UTC').to_date

        return if window_end <= window_start
        days = (window_start...window_end).to_a
        
        ActiveRecord::Base.transaction do
          rows = 0
          days.each { |day| rows += aggregate_day(day) }
          update_watermark(window_end.to_time.in_time_zone('UTC').beginning_of_day)
          dur = ((Time.current - start_time) * 1000).to_i
          log_success('FeatureStoreDaily', window_start, window_end, rows, dur)
        end
      ensure
        ActiveRecord::Base.connection.exec_query("SELECT pg_advisory_unlock($1)", 'Unlock', [[nil, LOCK_ID]])
      end
    end
    
    def aggregate_day(day)
      start_ts = day.in_time_zone('UTC').beginning_of_day
      end_ts   = (day + 1.day).in_time_zone('UTC').beginning_of_day

      sql = <<~SQL
        INSERT INTO company_feature_daily (company_id, day, engagement_score, lead_conversion_rate, review_velocity, unique_session_ratio, updated_at, created_at)
        SELECT 
          company_id, $1,
          (profile_views + (cta_clicks * 5) + (whatsapp_clicks * 10))::numeric,
          CASE WHEN profile_views > 0 THEN (leads::numeric / profile_views) ELSE 0 END,
          reviews, 0, NOW(), NOW()
        FROM company_daily_stats
        WHERE day = $1 AND company_id IS NOT NULL
        ON CONFLICT (company_id, day) DO UPDATE SET
          engagement_score = EXCLUDED.engagement_score,
          lead_conversion_rate = EXCLUDED.lead_conversion_rate,
          review_velocity = EXCLUDED.review_velocity,
          updated_at = NOW()
        RETURNING 1;
      SQL
      res = ActiveRecord::Base.connection.exec_query(sql, 'FeatureDaily', [[nil, day]])
      res.rows.size
    end
    
    private
    
    def get_watermark
      res = ActiveRecord::Base.connection.select_one("SELECT last_processed_at FROM analytics_processing_state WHERE pipeline_name = $1", 'Watermark', [[nil, PIPELINE]])
      res['last_processed_at'].to_time
    end

    def update_watermark(ts)
      ActiveRecord::Base.connection.exec_query("UPDATE analytics_processing_state SET last_processed_at = $1, updated_at = NOW() WHERE pipeline_name = $2", 'WatermarkUpdate', [[nil, ts], [nil, PIPELINE]])
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
