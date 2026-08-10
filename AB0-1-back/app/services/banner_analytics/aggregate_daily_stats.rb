module BannerAnalytics
  class AggregateDailyStats
    # Agrega os eventos da tabela banner_events em banner_daily_stats
    # params:
    # - date: Data específica para rodar a agregação. Padrão: ontem.
    # - start_date, end_date: Range de datas para backfill/reconciliação.
    def self.call(date: nil, start_date: nil, end_date: nil)
      if start_date && end_date
        (start_date.to_date..end_date.to_date).each do |d|
          aggregate_for_date(d)
        end
      else
        target_date = date || Date.yesterday
        aggregate_for_date(target_date.to_date)
      end
    end

    def self.aggregate_for_date(date)
      # Buscamos agrupado por banner_id e event_type no dia específico
      # Note que incluímos 'view' e 'impression' na contagem de views, 'click' em clicks, 'lead' em leads.
      
      start_of_day = date.beginning_of_day
      end_of_day = date.end_of_day

      aggregations = BannerEvent.reportable.where(tracked_at: start_of_day..end_of_day)
                                .group(:banner_id, :event_type)
                                .count

      # Transforma o hash { [banner_id, 'view'] => 10, [banner_id, 'click'] => 2 } em uma estrutura por banner
      # { banner_id => { views_count: 10, clicks_count: 2, leads_count: 1 } }
      banner_stats = Hash.new { |h, k| h[k] = { views_count: 0, clicks_count: 0, leads_count: 0 } }

      aggregations.each do |(banner_id, event_type), count|
        case event_type
        when 'view', 'impression'
          banner_stats[banner_id][:views_count] += count
        when 'click'
          banner_stats[banner_id][:clicks_count] += count
        when 'lead'
          banner_stats[banner_id][:leads_count] += count
        end
      end

      # Upsert all stats for the day
      attributes = banner_stats.map do |banner_id, stats|
        clicks = stats[:clicks_count]
        views = stats[:views_count]
        ctr = views.positive? ? ((clicks.to_f / views) * 100).round(2) : 0.0

        {
          banner_id: banner_id,
          day: date,
          views_count: views,
          clicks_count: clicks,
          leads_count: stats[:leads_count],
          ctr: ctr,
          cost_cents: 0,
          created_at: Time.current,
          updated_at: Time.current
        }
      end

      return if attributes.empty?

      # UPSERT: se [banner_id, day] já existe, atualiza views_count, clicks_count, leads_count, ctr.
      # O cost_cents não será alterado por este job (será resolvido no PerformanceService via subscriptions dinâmicas).
      BannerDailyStat.upsert_all(
        attributes,
        unique_by: [:banner_id, :day],
        update_only: [:views_count, :clicks_count, :leads_count, :ctr]
      )
    rescue StandardError => e
      report_aggregation_error(e)
      Rails.logger.error("[BannerAnalytics::AggregateDailyStats] Failed for date #{date}: #{e.message}")
      raise
    end

    def self.report_aggregation_error(error)
      return unless defined?(Sentry)

      Sentry.capture_exception(error, tags: { component: 'banner_daily_aggregation' })
    rescue StandardError => reporting_error
      Rails.logger.warn("[BannerAnalytics::AggregateDailyStats] Sentry reporting failed: #{reporting_error.message}")
    end
  end
end
