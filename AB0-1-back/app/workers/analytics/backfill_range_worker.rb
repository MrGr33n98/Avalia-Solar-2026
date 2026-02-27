# frozen_string_literal: true

module Analytics
  class BackfillRangeWorker
    include Sidekiq::Worker
    sidekiq_options queue: :maintenance, retry: 0

    def perform(start_date, end_date)
      return unless postgresql?
      
      from = Date.parse(start_date)
      to = Date.parse(end_date)
      
      (from..to).each do |day|
        Rails.logger.info("[G4-BackfillRange] Processing #{day}...")
        Analytics::BackfillWorker.new.recalculate_day(day)
        Analytics::FeatureStoreDailyWorker.new.aggregate_day(day)
        Analytics::AnomalyDailyWorker.new.recalculate_day(day)
      end
      
      Analytics::FeatureStoreRolling30dWorker.new.perform
      Analytics::TrustScoreWorker.new.perform
      Analytics::RankingScoreWorker.new.perform
    end

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end
  end
end
