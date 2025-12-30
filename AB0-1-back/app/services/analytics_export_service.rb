# frozen_string_literal: true

require 'csv'

module Analytics
  class ExportService
    def self.company_daily_stats_csv(company_id:, from_day:, to_day:)
      stats = CompanyDailyStat.for_company(company_id).for_days(from_day, to_day).order(:day)

      CSV.generate(headers: true) do |out|
        out << %w[day profile_views cta_clicks whatsapp_clicks leads reviews]
        stats.each do |row|
          out << [row.day, row.profile_views, row.cta_clicks, row.whatsapp_clicks, row.leads, row.reviews]
        end
      end
    end
  end
end

# Zeitwerk compatibility
AnalyticsExportService = Analytics::ExportService
