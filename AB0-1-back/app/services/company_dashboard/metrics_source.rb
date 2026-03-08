# frozen_string_literal: true

module CompanyDashboard
  class MetricsSource
    def initialize(company_id:)
      @company_id = company_id
    end

    def available?
      @company_id.present? && ActiveRecord::Base.connection.table_exists?('company_daily_stats')
    end

    def totals(from_day: nil, to_day: nil)
      return nil unless available?

      scope = base_scope(from_day:, to_day:)
      row = scope.pick(
        Arel.sql('COALESCE(SUM(profile_views), 0)'),
        Arel.sql('COALESCE(SUM(cta_clicks), 0)'),
        Arel.sql('COALESCE(SUM(whatsapp_clicks), 0)'),
        Arel.sql('COALESCE(SUM(email_clicks), 0)'),
        Arel.sql('COALESCE(SUM(phone_clicks), 0)'),
        Arel.sql('COALESCE(SUM(website_clicks), 0)'),
        Arel.sql('COALESCE(SUM(leads), 0)'),
        Arel.sql('COALESCE(SUM(unique_views), 0)'),
        Arel.sql('COALESCE(SUM(returning_views), 0)')
      )

      {
        profile_views: row[0].to_i,
        cta_clicks: row[1].to_i,
        whatsapp_clicks: row[2].to_i,
        email_clicks: row[3].to_i,
        phone_clicks: row[4].to_i,
        website_clicks: row[5].to_i,
        leads: row[6].to_i,
        unique_views: row[7].to_i,
        returning_views: row[8].to_i
      }
    rescue StandardError => e
      Rails.logger.warn("[CompanyDashboard::MetricsSource] totals failed: #{e.class} #{e.message}")
      nil
    end

    def timeseries(days:)
      return [] unless available?

      from_day = days.to_i.days.ago.to_date
      to_day = Date.current

      base_scope(from_day:, to_day:)
        .order(:day)
        .pluck(:day, :profile_views, :cta_clicks, :whatsapp_clicks, :email_clicks, :phone_clicks, :website_clicks, :leads)
        .map do |day, profile_views, cta_clicks, whatsapp_clicks, email_clicks, phone_clicks, website_clicks, leads|
          {
            date: day,
            profile_views: profile_views.to_i,
            cta_clicks: cta_clicks.to_i,
            whatsapp_clicks: whatsapp_clicks.to_i,
            email_clicks: email_clicks.to_i,
            phone_clicks: phone_clicks.to_i,
            website_clicks: website_clicks.to_i,
            leads: leads.to_i
          }
        end
    rescue StandardError => e
      Rails.logger.warn("[CompanyDashboard::MetricsSource] timeseries failed: #{e.class} #{e.message}")
      []
    end

    private

    def base_scope(from_day: nil, to_day: nil)
      scope = CompanyDailyStat.where(company_id: @company_id)
      return scope unless from_day.present? && to_day.present?

      scope.where(day: from_day..to_day)
    end
  end
end
