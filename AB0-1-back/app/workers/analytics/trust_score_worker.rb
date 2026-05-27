# frozen_string_literal: true

module Analytics
  class TrustScoreWorker
    include Sidekiq::Job
    sidekiq_options queue: :analytics, retry: 1

    PIPELINE = 'trust_score'
    LOCK_ID = Zlib.crc32(PIPELINE)

    # Weights matching TrustScore::CalculationService
    WEIGHTS = {
      base: 50,
      verification: 20,
      rating: 20,
      reviews: 10,
      engagement: 10,
      leads: 10
    }.freeze

    def perform
      return unless postgresql?

      raw_lock = ActiveRecord::Base.connection.select_value(ActiveRecord::Base.sanitize_sql_array(["SELECT pg_try_advisory_lock(?)", LOCK_ID]))
      return unless ActiveModel::Type::Boolean.new.cast(raw_lock)

      begin
        start_time = Time.current

        # SQL that matches TrustScore::CalculationService formula
        # Uses company attributes directly for performance in batch processing
        sql = <<~SQL
          WITH company_data AS (
            SELECT 
              c.id as company_id,
              c.verified,
              COALESCE(c.rating_avg, 0) as rating_avg,
              COALESCE(c.reviews_count, 0) as reviews_count,
              COALESCE(c.profile_views_count, 0) + (COALESCE(c.cta_clicks_count, 0) * 2) as engagement,
              COALESCE(c.leads_count, 0) as leads_count
            FROM companies c
            WHERE c.status = 'active'
          )
          INSERT INTO company_trust_score (company_id, score, components, computed_at, created_at, updated_at)
          SELECT 
            cd.company_id,
            GREATEST(0, LEAST(100,
              -- Base score
              #{WEIGHTS[:base]} +
              -- Verification: +20 if verified
              CASE WHEN cd.verified = true THEN #{WEIGHTS[:verification]} ELSE 0 END +
              -- Rating: (rating / 5) * 20
              (LEAST(cd.rating_avg, #{TrustScore::CalculationService::MAX_VALUES[:rating]}) / #{TrustScore::CalculationService::MAX_VALUES[:rating]}) * #{WEIGHTS[:rating]} +
              -- Reviews: min((reviews / 100) * 10, 10)
              LEAST((cd.reviews_count::float / #{TrustScore::CalculationService::MAX_VALUES[:reviews]}) * #{WEIGHTS[:reviews]}, #{WEIGHTS[:reviews]}) +
              -- Engagement: log-scaled
              (LN(1 + LEAST(cd.engagement, #{TrustScore::CalculationService::MAX_VALUES[:engagement]})) / LN(1 + #{TrustScore::CalculationService::MAX_VALUES[:engagement]})) * #{WEIGHTS[:engagement]} +
              -- Leads: (leads / 100) * 10
              LEAST((cd.leads_count::float / #{TrustScore::CalculationService::MAX_VALUES[:leads]}) * #{WEIGHTS[:leads]}, #{WEIGHTS[:leads]})
            )),
            jsonb_build_object(
              'base', #{WEIGHTS[:base]},
              'verification', CASE WHEN cd.verified = true THEN #{WEIGHTS[:verification]} ELSE 0 END,
              'rating', (LEAST(cd.rating_avg, #{TrustScore::CalculationService::MAX_VALUES[:rating]}) / #{TrustScore::CalculationService::MAX_VALUES[:rating]}) * #{WEIGHTS[:rating]},
              'reviews', LEAST((cd.reviews_count::float / #{TrustScore::CalculationService::MAX_VALUES[:reviews]}) * #{WEIGHTS[:reviews]}, #{WEIGHTS[:reviews]}),
              'engagement', (LN(1 + LEAST(cd.engagement, #{TrustScore::CalculationService::MAX_VALUES[:engagement]})) / LN(1 + #{TrustScore::CalculationService::MAX_VALUES[:engagement]})) * #{WEIGHTS[:engagement]},
              'leads', LEAST((cd.leads_count::float / #{TrustScore::CalculationService::MAX_VALUES[:leads]}) * #{WEIGHTS[:leads]}, #{WEIGHTS[:leads]}),
              'penalty', 0
            ),
            NOW(), NOW(), NOW()
          FROM company_data cd
          ON CONFLICT (company_id) DO UPDATE SET 
            score = EXCLUDED.score, 
            components = EXCLUDED.components, 
            computed_at = EXCLUDED.computed_at, 
            updated_at = NOW()
          RETURNING 1;
        SQL

        res = ActiveRecord::Base.connection.exec_query(sql, 'TrustScore')

        dur = ((Time.current - start_time) * 1000).to_i
        Rails.logger.info "[TrustScoreWorker] Processed #{res.rows.size} companies in #{dur}ms"
      ensure
        ActiveRecord::Base.connection.exec_query(ActiveRecord::Base.sanitize_sql_array(["SELECT pg_advisory_unlock(?)", LOCK_ID]))
      end
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
