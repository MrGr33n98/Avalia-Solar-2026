module BannerAnalytics
  class OperationalHealth
    STALE_AFTER_HOURS = 36
    CACHE_TTL = 1.minute

    def self.call(banner_ids:)
      new(banner_ids: banner_ids).call
    end

    def initialize(banner_ids:)
      @banner_ids = Array(banner_ids).map(&:to_i).select(&:positive?)
    end

    def call
      return empty_health if @banner_ids.empty?

      cache_key = "banner-operational-health/v1/#{Digest::SHA256.hexdigest(@banner_ids.sort.join(','))}"
      return Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) { calculate } if defined?(Rails) && Rails.cache

      calculate
    end

    private

    def calculate
      started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      now = Time.current
      stats = BannerDailyStat.where(banner_id: @banner_ids)
      events = BannerEvent.where(banner_id: @banner_ids).where('tracked_at >= ?', 24.hours.ago)
      history_events = BannerEvent.where(banner_id: @banner_ids).where('tracked_at >= ?', 6.days.ago.beginning_of_day)
      last_aggregated_at = stats.maximum(:updated_at)
      reportable = events.where(valid_for_reporting: true).count
      discarded_scope = events.where(valid_for_reporting: false)
      discarded = discarded_scope.count
      discard_reasons = discarded_scope.group(:discard_reason).count.transform_keys { |reason| reason.presence || 'unknown' }
      total = reportable + discarded
      discard_rate = total.positive? ? ((discarded.to_f / total) * 100).round(2) : 0.0
      lag_minutes = last_aggregated_at ? ((now - last_aggregated_at) / 60).round : nil
      reconciliation = BannerAnalytics::ReconciliationService.call(date: Date.yesterday, banner_ids: @banner_ids)
      divergent = reconciliation[:summary].fetch('divergent', 0)

      Banners::Metrics.health_gauges(discard_rate: discard_rate, lag_minutes: lag_minutes)

      status = if last_aggregated_at.nil?
                 'unknown'
               elsif lag_minutes > STALE_AFTER_HOURS * 60
                 'stale'
               elsif divergent.positive? || (total.positive? && (discarded.to_f / total) > 0.2)
                 'degraded'
               else
                 'healthy'
               end

      {
        status: status,
        last_aggregated_at: last_aggregated_at,
        lag_minutes: lag_minutes,
        reportable_events_24h: reportable,
        discarded_events_24h: discarded,
        discard_rate_24h: discard_rate,
        discard_reasons_24h: discard_reasons,
        divergent_banners_yesterday: divergent,
        quality_history: quality_history(history_events, now),
        incident_history: incident_history(history_events, stats, now),
        checked_at: now
      }
    ensure
      Banners::Metrics.duration(Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at)
    end

    def quality_history(events, now)
      (6.days.ago.to_date..now.to_date).map do |day|
        day_events = events.where(tracked_at: day.beginning_of_day..day.end_of_day)
        valid = day_events.where(valid_for_reporting: true).count
        discarded = day_events.where(valid_for_reporting: false).count
        total = valid + discarded
        {
          date: day,
          reportable_events: valid,
          discarded_events: discarded,
          discard_rate: total.positive? ? ((discarded.to_f / total) * 100).round(2) : 0.0
        }
      end
    end

    def incident_history(events, stats, now)
      (6.days.ago.to_date..now.to_date).flat_map do |day|
        day_events = events.where(tracked_at: day.beginning_of_day..day.end_of_day)
        valid = day_events.where(valid_for_reporting: true).count
        discarded = day_events.where(valid_for_reporting: false).count
        total = valid + discarded
        incidents = []
        if total.positive? && (discarded.to_f / total) > 0.2
          incidents << { date: day, type: 'discard_rate_high', severity: 'warning', value: ((discarded.to_f / total) * 100).round(2), affected_banners: banner_details(day_events) }
        end

        reconciliation = BannerAnalytics::ReconciliationService.call(date: day, banner_ids: @banner_ids)
        divergent_results = reconciliation[:results].select { |result| result[:status] == 'divergent' }
        if divergent_results.any?
          incidents << { date: day, type: 'reconciliation_divergence', severity: 'warning', value: divergent_results.length,
                         affected_banners: banner_details_for_ids(divergent_results.map { |result| result[:banner_id] }) }
        end

        if total.positive? && !stats.where(day: day).exists?
          incidents << { date: day, type: 'aggregate_missing', severity: 'critical', value: total, affected_banners: banner_details(day_events) }
        end
        incidents
      end
    end

    def banner_details(events)
      counts = events.group(:banner_id).count
      banner_details_for_ids(counts.keys).map do |banner|
        banner.merge(event_count: counts[banner[:id]] || 0)
      end
    end

    def banner_details_for_ids(ids)
      Banner.where(id: ids).pluck(:id, :title).map { |id, title| { id: id, title: title.presence || 'Banner sem título' } }
    end

    def empty_health
      { status: 'unknown', last_aggregated_at: nil, lag_minutes: nil, reportable_events_24h: 0,
        discarded_events_24h: 0, discard_rate_24h: 0.0, discard_reasons_24h: {},
        divergent_banners_yesterday: 0, quality_history: [], incident_history: [], checked_at: Time.current }
    end
  end
end
