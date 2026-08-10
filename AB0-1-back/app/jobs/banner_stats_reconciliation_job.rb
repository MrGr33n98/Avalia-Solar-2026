class BannerStatsReconciliationJob
  include Sidekiq::Job
  sidekiq_options queue: :analytics, retry: 3

  def perform(start_date = nil, end_date = nil)
    range_end = end_date.present? ? Date.parse(end_date.to_s) : Date.yesterday
    range_start = start_date.present? ? Date.parse(start_date.to_s) : range_end

    BannerAnalytics::AggregateDailyStats.call(start_date: range_start, end_date: range_end)
    Rails.logger.info("[BannerStatsReconciliationJob] Reconciled #{range_start}..#{range_end}")
  rescue ArgumentError => e
    Rails.logger.error("[BannerStatsReconciliationJob] Invalid date range: #{e.message}")
    raise
  end
end
