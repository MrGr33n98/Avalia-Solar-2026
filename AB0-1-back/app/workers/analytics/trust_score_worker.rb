# frozen_string_literal: true

module Analytics
  class TrustScoreWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :analytics, retry: 1

    PIPELINE = 'trust_score'
    LOCK_ID = Zlib.crc32(PIPELINE)

    def perform
      return unless postgresql?

      raw_lock = ActiveRecord::Base.connection.select_value("SELECT pg_try_advisory_lock($1)", 'Lock', [[nil, LOCK_ID]])
      return unless ActiveModel::Type::Boolean.new.cast(raw_lock)

      begin
        start_time = Time.current
        sql = <<~SQL
          WITH rolling AS (
            SELECT company_id, avg_engagement, total_leads, conversion_trend FROM company_feature_rolling_30d
          ),
          anomalies AS (
            SELECT company_id, COUNT(*) as anomaly_count FROM company_anomaly_daily WHERE flagged = true AND day >= CURRENT_DATE - 30 GROUP BY 1
          )
          INSERT INTO company_trust_score (company_id, score, components, computed_at, created_at, updated_at)
          SELECT 
            r.company_id,
            GREATEST(0, LEAST(100, (LEAST(r.total_leads, 100) * 0.3) + (LEAST(r.avg_engagement, 500) * 0.1) - (COALESCE(a.anomaly_count, 0) * 5))),
            jsonb_build_object('leads', LEAST(r.total_leads, 100) * 0.3, 'engagement', LEAST(r.avg_engagement, 500) * 0.1, 'penalty', COALESCE(a.anomaly_count, 0) * 5),
            NOW(), NOW(), NOW()
          FROM rolling r
          LEFT JOIN anomalies a ON r.company_id = a.company_id
          ON CONFLICT (company_id) DO UPDATE SET score = EXCLUDED.score, components = EXCLUDED.components, computed_at = EXCLUDED.computed_at, updated_at = NOW()
          RETURNING 1;
        SQL

        res = ActiveRecord::Base.connection.exec_query(sql, 'TrustScore')
        ActiveRecord::Base.connection.exec_query("UPDATE analytics_processing_state SET last_processed_at = NOW() WHERE pipeline_name = $1", 'State', [[nil, PIPELINE]])
        
        dur = ((Time.current - start_time) * 1000).to_i
        log_run('TrustScore', 'AllCompanies', res.rows.size, dur)
      ensure
        ActiveRecord::Base.connection.exec_query("SELECT pg_advisory_unlock($1)", 'Unlock', [[nil, LOCK_ID]])
      end
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
