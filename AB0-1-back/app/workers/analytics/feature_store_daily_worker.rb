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

      raw_lock = ActiveRecord::Base.connection.select_value(ActiveRecord::Base.sanitize_sql_array(["SELECT pg_try_advisory_lock(?)", LOCK_ID]))
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
        ActiveRecord::Base.connection.exec_query(ActiveRecord::Base.sanitize_sql_array(["SELECT pg_advisory_unlock(?)", LOCK_ID]))
      end
    end
    
    def aggregate_day(day)
      is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i
      
      sql = <<~SQL
        INSERT INTO company_feature_daily (company_id, day, engagement_score, lead_conversion_rate, review_velocity, unique_session_ratio, updated_at, created_at)
        SELECT 
          company_id, $1,
          (profile_views + (cta_clicks * 5) + (whatsapp_clicks * 10))::numeric,
          CASE WHEN profile_views > 0 THEN (leads / profile_views) ELSE 0 END,
          reviews, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM company_daily_stats
        WHERE day = $1 AND company_id IS NOT NULL
        ON CONFLICT (company_id, day) DO UPDATE SET
          engagement_score = EXCLUDED.engagement_score,
          lead_conversion_rate = EXCLUDED.lead_conversion_rate,
          review_velocity = EXCLUDED.review_velocity,
          updated_at = CURRENT_TIMESTAMP
        RETURNING 1;
      SQL

      # SQLite compatibility fallback
      unless is_pg
        sql = <<~SQL
          INSERT INTO company_feature_daily (company_id, day, engagement_score, lead_conversion_rate, review_velocity, unique_session_ratio, updated_at, created_at)
          SELECT 
            company_id, date($1),
            (profile_views + (cta_clicks * 5) + (whatsapp_clicks * 10)),
            CASE WHEN profile_views > 0 THEN (leads * 1.0 / profile_views) ELSE 0 END,
            reviews, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          FROM company_daily_stats
          WHERE day = date($1) AND company_id IS NOT NULL
        SQL
      end

      res = ActiveRecord::Base.connection.execute(ActiveRecord::Base.send(:sanitize_sql_array, [sql, day.to_s]))
      is_pg ? res.rows.size : 1
    end
    
    private
    
    def get_watermark
      res = ActiveRecord::Base.connection.select_one(ActiveRecord::Base.sanitize_sql_array(["SELECT last_processed_at FROM analytics_processing_state WHERE pipeline_name = ?", PIPELINE]))
      res ? res['last_processed_at'].to_time : 1.day.ago
    end

    def update_watermark(ts)
      ActiveRecord::Base.connection.execute(ActiveRecord::Base.send(:sanitize_sql_array, ["UPDATE analytics_processing_state SET last_processed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE pipeline_name = ?", ts.iso8601, PIPELINE]))
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
