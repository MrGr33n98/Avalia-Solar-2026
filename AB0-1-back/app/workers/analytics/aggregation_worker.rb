# frozen_string_literal: true

module Analytics
  class AggregationWorker
    include Sidekiq::Worker
    sidekiq_options queue: :analytics, retry: 1

    SAFETY_LAG = 30.seconds
    PIPELINE = 'main_aggregation'
    LOCK_ID = Zlib.crc32(PIPELINE)

    def perform
      return unless postgresql?

      # Ajuste 1: Parsing robusto do Advisory Lock
      raw_lock = ActiveRecord::Base.connection.select_value(
        "SELECT pg_try_advisory_lock($1)", 'Lock', [[nil, LOCK_ID]]
      )
      got_lock = ActiveModel::Type::Boolean.new.cast(raw_lock)
      
      return Rails.logger.warn("[G4-Aggregation] Locked. Skipping.") unless got_lock

      begin
        execute_aggregation_pipeline
      ensure
        # Ajuste 1: pg_advisory_unlock via exec_query com bind
        ActiveRecord::Base.connection.exec_query(
          "SELECT pg_advisory_unlock($1)", 'Unlock', [[nil, LOCK_ID]]
        )
      end
    end

    private

    def execute_aggregation_pipeline
      start_time = Time.current
      # Ajuste 3: Leitura normal sem FOR UPDATE (Advisory Lock ja isola o runner)
      window_start = get_watermark
      window_end = Time.current - SAFETY_LAG

      return if window_end <= window_start

      ActiveRecord::Base.transaction do
        # Ajuste 5: Whitelist explicita de tabelas e metodos, nenhum 'send' livre
        %w[company_daily_stats category_daily_stats platform_daily_stats].each do |table|
          aggregate_to_table(table, window_start, window_end)
        end

        update_watermark(window_end)

        duration = ((Time.current - start_time) * 1000).to_i
        log_success(window_start, window_end, duration)
      end
    end

    def aggregate_to_table(table_name, from, to)
      # Ajuste 2 e 5: SQL Binds ($1, $2) para evitar injecao e permitir cache de plano
      sql = case table_name
            when 'company_daily_stats' then sql_company
            when 'category_daily_stats' then sql_category
            when 'platform_daily_stats' then sql_platform
            else raise "Invalid table: #{table_name}"
            end

      # Ajuste 2 e 4: Half-open window e exec_query com binds
      result = ActiveRecord::Base.connection.exec_query(
        sql, 'AggregationUpdate', [[nil, from], [nil, to]]
      )
      # Retorno seguro pois as queries usam RETURNING 1
      result.rows.size
    end

    def sql_company
      <<~SQL
        INSERT INTO company_daily_stats (company_id, day, profile_views, cta_clicks, whatsapp_clicks, leads, reviews, updated_at, created_at)
        SELECT 
          company_id, occurred_at::date,
          COUNT(*) FILTER (WHERE event_type = 'profile_view'),
          COUNT(*) FILTER (WHERE event_type = 'cta_click'),
          COUNT(*) FILTER (WHERE event_type = 'whatsapp_click'),
          COUNT(*) FILTER (WHERE event_type = 'lead_created'),
          COUNT(*) FILTER (WHERE event_type = 'review_created'),
          NOW(), NOW()
        FROM platform_events
        WHERE occurred_at >= $1 AND occurred_at < $2
          AND company_id IS NOT NULL
        GROUP BY 1, 2
        ON CONFLICT (company_id, day) DO UPDATE SET
          profile_views = company_daily_stats.profile_views + EXCLUDED.profile_views,
          cta_clicks = company_daily_stats.cta_clicks + EXCLUDED.cta_clicks,
          whatsapp_clicks = company_daily_stats.whatsapp_clicks + EXCLUDED.whatsapp_clicks,
          leads = company_daily_stats.leads + EXCLUDED.leads,
          reviews = company_daily_stats.reviews + EXCLUDED.reviews,
          updated_at = NOW()
        RETURNING 1;
      SQL
    end

    def sql_category
      <<~SQL
        INSERT INTO category_daily_stats (category_id, day, page_views, searches, updated_at, created_at)
        SELECT 
          COALESCE((payload->>'category_id')::bigint, 0),
          occurred_at::date,
          COUNT(*) FILTER (WHERE event_type = 'page_view'),
          COUNT(*) FILTER (WHERE event_type = 'search'),
          NOW(), NOW()
        FROM platform_events
        WHERE occurred_at >= $1 AND occurred_at < $2
        GROUP BY 1, 2
        ON CONFLICT (category_id, day) DO UPDATE SET
          page_views = category_daily_stats.page_views + EXCLUDED.page_views,
          searches = category_daily_stats.searches + EXCLUDED.searches,
          updated_at = NOW()
        RETURNING 1;
      SQL
    end

    def sql_platform
      <<~SQL
        INSERT INTO platform_daily_stats (day, total_page_views, total_searches, updated_at, created_at)
        SELECT 
          occurred_at::date,
          COUNT(*) FILTER (WHERE event_type = 'page_view'),
          COUNT(*) FILTER (WHERE event_type = 'search'),
          NOW(), NOW()
        FROM platform_events
        WHERE occurred_at >= $1 AND occurred_at < $2
        GROUP BY 1
        ON CONFLICT (day) DO UPDATE SET
          total_page_views = platform_daily_stats.total_page_views + EXCLUDED.total_page_views,
          total_searches = platform_daily_stats.total_searches + EXCLUDED.total_searches,
          updated_at = NOW()
        RETURNING 1;
      SQL
    end

    def get_watermark
      sql = "SELECT last_processed_at FROM analytics_processing_state WHERE pipeline_name = $1"
      res = ActiveRecord::Base.connection.select_one(sql, 'WatermarkRead', [[nil, PIPELINE]])
      res['last_processed_at'].to_time
    end

    def update_watermark(ts)
      sql = "UPDATE analytics_processing_state SET last_processed_at = $1, updated_at = NOW() WHERE pipeline_name = $2"
      ActiveRecord::Base.connection.exec_query(sql, 'WatermarkUpdate', [[nil, ts], [nil, PIPELINE]])
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end

    def log_success(start_ts, stop_ts, dur)
      Rails.logger.info("[G4-Aggregation] Window: #{start_ts.iso8601}..#{stop_ts.iso8601} | Duration: #{dur}ms")
    end
  end
end
