# frozen_string_literal: true

module Analytics
  class RankingScoreWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :analytics, retry: 1

    PIPELINE = 'ranking_score'
    LOCK_ID = Zlib.crc32(PIPELINE)

    def perform
      return unless postgresql?

      raw_lock = ActiveRecord::Base.connection.select_value("SELECT pg_try_advisory_lock($1)", 'Lock', [[nil, LOCK_ID]])
      return unless ActiveModel::Type::Boolean.new.cast(raw_lock)

      begin
        start_time = Time.current
        sql = <<~SQL
          INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at)
          SELECT 
            t.company_id,
            (t.score * 10) + COALESCE(SUM(f.engagement_score * EXP(-0.1 * (CURRENT_DATE - f.day))), 0),
            jsonb_build_object('base_trust', t.score, 'recent_engagement', COALESCE(SUM(f.engagement_score * EXP(-0.1 * (CURRENT_DATE - f.day))), 0)),
            NOW(), NOW(), NOW()
          FROM company_trust_score t
          LEFT JOIN company_feature_daily f ON t.company_id = f.company_id AND f.day >= CURRENT_DATE - 7
          GROUP BY t.company_id, t.score
          ON CONFLICT (company_id) DO UPDATE SET score = EXCLUDED.score, breakdown = EXCLUDED.breakdown, computed_at = EXCLUDED.computed_at, updated_at = NOW()
          RETURNING 1;
        SQL

        res = ActiveRecord::Base.connection.exec_query(sql, 'RankingScore')
        ActiveRecord::Base.connection.exec_query("UPDATE analytics_processing_state SET last_processed_at = NOW() WHERE pipeline_name = $1", 'State', [[nil, PIPELINE]])
        
        dur = ((Time.current - start_time) * 1000).to_i
        log_run('RankingScore', 'AllCompanies', res.rows.size, dur)
      ensure
        ActiveRecord::Base.connection.exec_query("SELECT pg_advisory_unlock($1)", 'Unlock', [[nil, LOCK_ID]])
      end
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
