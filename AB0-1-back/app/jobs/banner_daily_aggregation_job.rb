class BannerDailyAggregationJob
  include Sidekiq::Job
  sidekiq_options queue: :analytics, retry: 3

  # Executado todo dia às 01:00 AM (via schedule.yml ou equivalente)
  def perform(date = nil)
    target_date = date.present? ? Date.parse(date.to_s) : Date.yesterday
    BannerAnalytics::AggregateDailyStats.call(date: target_date)
  end
end
