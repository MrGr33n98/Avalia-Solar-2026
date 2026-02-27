# frozen_string_literal: true

module Analytics
  class BackfillWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :maintenance, retry: 1

    def perform(target_date = nil)
      return unless postgresql?
      
      day = target_date ? Date.parse(target_date) : Date.yesterday
      recalculate_day(day)
      recalculate_day(Date.current) if target_date.nil?
    end

    def recalculate_day(day)
      start_ts = day.to_time.in_time_zone('UTC').beginning_of_day
      end_ts   = (day + 1.day).to_time.in_time_zone('UTC').beginning_of_day
      start_time = Time.current

      sql = <<~SQL
        INSERT INTO company_daily_stats (company_id, day, profile_views, cta_clicks, whatsapp_clicks, leads, reviews, updated_at, created_at)
        SELECT 
          company_id, $1,
          COUNT(*) FILTER (WHERE event_type = 'profile_view'),
          COUNT(*) FILTER (WHERE event_type = 'cta_click'),
          COUNT(*) FILTER (WHERE event_type = 'whatsapp_click'),
          COUNT(*) FILTER (WHERE event_type = 'lead_created'),
          COUNT(*) FILTER (WHERE event_type = 'review_created'),
          NOW(), NOW()
        FROM platform_events
        WHERE occurred_at >= $2 AND occurred_at < $3
          AND company_id IS NOT NULL
        GROUP BY 1, 2
        ON CONFLICT (company_id, day) DO UPDATE SET
          profile_views = EXCLUDED.profile_views,
          cta_clicks = EXCLUDED.cta_clicks,
          whatsapp_clicks = EXCLUDED.whatsapp_clicks,
          leads = EXCLUDED.leads,
          reviews = EXCLUDED.reviews,
          updated_at = NOW()
        RETURNING 1;
      SQL

      res = ActiveRecord::Base.connection.exec_query(sql, 'BackfillRecalc', [[nil, day], [nil, start_ts], [nil, end_ts]])
      dur = ((Time.current - start_time) * 1000).to_i
      log_run('Backfill', day.to_s, res.rows.size, dur)
    end

    private

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
