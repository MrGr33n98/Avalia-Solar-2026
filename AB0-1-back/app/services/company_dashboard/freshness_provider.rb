# frozen_string_literal: true

module CompanyDashboard
  class FreshnessProvider
    PIPELINE = 'main_aggregation'

    def self.call
      sql = ActiveRecord::Base.sanitize_sql_array([
                                                    'SELECT last_processed_at FROM analytics_processing_state WHERE pipeline_name = ?',
                                                    PIPELINE
                                                  ])
      res = ActiveRecord::Base.connection.select_one(sql)

      last_aggregated_at = res ? Time.zone.parse(res['last_processed_at'].to_s) : nil
      freshness_seconds = last_aggregated_at ? (Time.current - last_aggregated_at).to_i : nil

      {
        last_aggregated_at: last_aggregated_at,
        data_freshness_seconds: freshness_seconds
      }
    rescue StandardError => e
      Rails.logger.warn("[CompanyDashboard::FreshnessProvider] failed: #{e.class} #{e.message}")
      { last_aggregated_at: nil, data_freshness_seconds: nil }
    end
  end
end
