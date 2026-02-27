# frozen_string_literal: true

module Analytics
  class FeatureStoreRolling30dWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :analytics, retry: 1

    PIPELINE = 'feature_store_rolling_30d'
    LOCK_ID = Zlib.crc32(PIPELINE)

    def perform
      return unless postgresql?

      raw_lock = ActiveRecord::Base.connection.select_value("SELECT pg_try_advisory_lock($1)", 'Lock', [[nil, LOCK_ID]])
      return unless ActiveModel::Type::Boolean.new.cast(raw_lock)

      begin
        start_time = Time.current
        
        sql = <<~SQL
          WITH daily_stats AS (
            SELECT company_id,
                   SUM(leads) as sum_leads_30d,
                   SUM(profile_views) as sum_views_30d,
                   SUM(leads) FILTER (WHERE day >= CURRENT_DATE - 7) as leads_7d,
                   SUM(profile_views) FILTER (WHERE day >= CURRENT_DATE - 7) as views_7d,
                   SUM(leads) FILTER (WHERE day >= CURRENT_DATE - 14 AND day < CURRENT_DATE - 7) as leads_prev_7d,
                   SUM(profile_views) FILTER (WHERE day >= CURRENT_DATE - 14 AND day < CURRENT_DATE - 7) as views_prev_7d
            FROM company_daily_stats
            WHERE day >= CURRENT_DATE - 30 AND company_id IS NOT NULL
            GROUP BY company_id
          ),
          features AS (
            SELECT company_id, AVG(engagement_score) as avg_engagement
            FROM company_feature_daily
            WHERE day >= CURRENT_DATE - 30
            GROUP BY company_id
          )
          INSERT INTO company_feature_rolling_30d (company_id, computed_at, avg_engagement, total_leads, total_views, conversion_trend, created_at, updated_at)
          SELECT
            s.company_id,
            NOW(),
            COALESCE(f.avg_engagement, 0),
            COALESCE(s.sum_leads_30d, 0),
            COALESCE(s.sum_views_30d, 0),
            CASE WHEN COALESCE(s.views_prev_7d, 0) > 0 AND COALESCE(s.leads_prev_7d, 0) > 0 AND COALESCE(s.views_7d, 0) > 0
                 THEN (s.leads_7d::numeric / s.views_7d) / (s.leads_prev_7d::numeric / s.views_prev_7d)
                 WHEN COALESCE(s.views_7d, 0) > 0 AND COALESCE(s.leads_7d, 0) > 0
                 THEN 1.0
                 ELSE 0
            END AS conversion_trend,
            NOW(), NOW()
          FROM daily_stats s
          LEFT JOIN features f ON s.company_id = f.company_id
          ON CONFLICT (company_id) DO UPDATE SET
            avg_engagement = EXCLUDED.avg_engagement,
            total_leads = EXCLUDED.total_leads,
            total_views = EXCLUDED.total_views,
            conversion_trend = EXCLUDED.conversion_trend,
            computed_at = NOW()
          RETURNING 1;
        SQL
        
        res = ActiveRecord::Base.connection.exec_query(sql, 'Rolling30dUpdate')
        ActiveRecord::Base.connection.exec_query("UPDATE analytics_processing_state SET last_processed_at = NOW() WHERE pipeline_name = $1", 'State', [[nil, PIPELINE]])
        
        dur = ((Time.current - start_time) * 1000).to_i
        log_run('FeatureRolling30d', 'AllCompanies', res.rows.size, dur)
      ensure
        ActiveRecord::Base.connection.exec_query("SELECT pg_advisory_unlock($1)", 'Unlock', [[nil, LOCK_ID]])
      end
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
