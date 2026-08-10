module BannerAnalytics
  class ReconciliationService
    METRICS = { views_count: %w[view impression], clicks_count: %w[click], leads_count: %w[lead] }.freeze

    def self.call(date: Date.yesterday, tolerance_percent: nil, banner_ids: nil)
      new(date: date, tolerance_percent: tolerance_percent, banner_ids: banner_ids).call
    end

    def initialize(date:, tolerance_percent:, banner_ids: nil)
      @date = date.to_date
      @banner_ids = Array(banner_ids).map(&:to_i).select(&:positive?)
      @tolerance_percent = tolerance_percent.nil? ? ENV.fetch('BANNER_RECON_TOLERANCE_PERCENT', 0).to_f : tolerance_percent.to_f
    end

    def call
      stats_scope = BannerDailyStat.where(day: @date)
      stats_scope = stats_scope.where(banner_id: @banner_ids) if @banner_ids.any?
      stats = stats_scope.index_by(&:banner_id)
      banner_ids = (stats.keys + observed.keys).uniq
      results = banner_ids.map { |banner_id| reconcile_banner(banner_id, stats[banner_id], observed[banner_id] || {}) }
      { date: @date, tolerance_percent: @tolerance_percent, summary: results.group_by { |r| r[:status] }.transform_values(&:count), results: results }
    rescue StandardError => e
      report_reconciliation_error(e)
      raise
    end

    private

    def report_reconciliation_error(error)
      return unless defined?(Sentry)

      Sentry.capture_exception(error, tags: { component: 'banner_reconciliation' })
    rescue StandardError => reporting_error
      Rails.logger.warn("[BannerReconciliation] Sentry reporting failed: #{reporting_error.message}")
    end

    def observed
      @observed ||= BannerEvent.reportable.where(tracked_at: @date.beginning_of_day..@date.end_of_day)
        .then { |scope| @banner_ids.any? ? scope.where(banner_id: @banner_ids) : scope }
        .group(:banner_id, :event_type).count
        .each_with_object(Hash.new { |hash, key| hash[key] = {} }) do |((banner_id, event_type), count), result|
          result[banner_id][event_type] = count
        end
    end

    def reconcile_banner(banner_id, stat, raw)
      fields = METRICS.each_with_object({}) do |(field, event_types), result|
        canonical = stat&.public_send(field).to_i
        observed_count = event_types.sum { |event_type| raw.fetch(event_type, 0).to_i }
        result[field] = { canonical: canonical, observed: observed_count, delta: observed_count - canonical }
      end
      status = fields.values.any? { |value| value[:delta].abs > tolerance_for(value[:canonical]) } ? 'divergent' : 'consistent'
      fields.each_key { |metric| Banners::Metrics.reconciliation(status: status, metric: metric) }
      { banner_id: banner_id, status: status, metrics: fields }
    end

    def tolerance_for(canonical)
      return @tolerance_percent if @tolerance_percent <= 1
      (canonical.abs * @tolerance_percent / 100.0).ceil
    end
  end
end
