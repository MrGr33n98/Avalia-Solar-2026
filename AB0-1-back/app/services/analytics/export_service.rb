# frozen_string_literal: true

require 'csv'

module Analytics
  class ExportService
    def initialize(company:, from:, to:, kind: :events)
      @company = company
      @from = from
      @to = to
      @kind = kind.to_sym
    end

    def call
      case @kind
      when :events then export_events
      when :daily_stats then export_daily_stats
      else raise ArgumentError, 'invalid kind'
      end
    end

    private

    def export_events
      scope = AnalyticsEvent.for_company(@company.id).in_range(@from, @to).order(:tracked_at)
      CSV.generate(headers: true) do |csv|
        csv << %w[id company_id user_id event_type source tracked_at metadata]
        scope.find_each do |ev|
          csv << [ev.id, ev.company_id, ev.user_id, ev.event_type, ev.source, ev.tracked_at.iso8601, ev.metadata.to_json]
        end
      end
    end

    def export_daily_stats
      scope = CompanyDailyStat.for_company(@company.id).for_days(@from.to_date, @to.to_date).order(:day)
      CSV.generate(headers: true) do |csv|
        csv << %w[company_id day events_count quote_clicks whatsapp_clicks reviews_count average_rating rating_count]
        scope.find_each do |st|
          csv << [st.company_id, st.day, st.events_count, st.quote_clicks, st.whatsapp_clicks, st.reviews_count, st.average_rating, st.rating_count]
        end
      end
    end
  end
end
