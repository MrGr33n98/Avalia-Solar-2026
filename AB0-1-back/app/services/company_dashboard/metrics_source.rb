# frozen_string_literal: true

module CompanyDashboard
  class MetricsSource
    TOTAL_KEYS = %i[
      profile_views
      cta_clicks
      whatsapp_clicks
      email_clicks
      phone_clicks
      website_clicks
      leads
      unique_views
      returning_views
    ].freeze

    PROFILE_VIEW_EVENTS = %w[
      profile_view
      Company\ Profile\ Viewed
      company_profile_viewed
    ].freeze
    CTA_CLICK_EVENTS = %w[
      cta_click
      CTA\ Clicked
      cta_clicked
      company_cta_clicked
      company_cta_quote
    ].freeze
    WHATSAPP_CLICK_EVENTS = %w[
      whatsapp_click
      WhatsApp\ CTA\ Clicked
      company_cta_whatsapp
    ].freeze
    EMAIL_CLICK_EVENTS = %w[
      Email\ CTA\ Clicked
      email_click
      company_cta_email
    ].freeze
    PHONE_CLICK_EVENTS = %w[
      Phone\ CTA\ Clicked
      phone_click
      company_cta_phone
    ].freeze
    WEBSITE_CLICK_EVENTS = %w[
      Website\ CTA\ Clicked
      website_click
      company_cta_website
    ].freeze
    LEAD_EVENTS = %w[
      lead_created
      Lead\ Form\ Submitted
      Quote\ Request\ CTA\ Clicked
    ].freeze
    EVENT_TYPE_TO_METRIC = {
      **PROFILE_VIEW_EVENTS.index_with { :profile_views },
      **CTA_CLICK_EVENTS.index_with { :cta_clicks },
      **WHATSAPP_CLICK_EVENTS.index_with { :whatsapp_clicks },
      **EMAIL_CLICK_EVENTS.index_with { :email_clicks },
      **PHONE_CLICK_EVENTS.index_with { :phone_clicks },
      **WEBSITE_CLICK_EVENTS.index_with { :website_clicks },
      **LEAD_EVENTS.index_with { :leads }
    }.freeze
    CTA_TYPE_TO_METRIC = {
      'whatsapp' => :whatsapp_clicks,
      'email' => :email_clicks,
      'phone' => :phone_clicks,
      'website' => :website_clicks
    }.freeze

    def initialize(company_id:)
      @company_id = company_id
    end

    def available?
      @company_id.present? && ActiveRecord::Base.connection.table_exists?('company_daily_stats')
    end

    def aggregated_data_available?(from_day: nil, to_day: nil)
      return false unless available?

      base_scope(from_day: from_day, to_day: to_day).exists?
    rescue StandardError => e
      Rails.logger.warn("[CompanyDashboard::MetricsSource] aggregated_data_available? failed: #{e.class} #{e.message}")
      false
    end

    def totals(from_day: nil, to_day: nil)
      return nil unless available?

      scope = base_scope(from_day: from_day, to_day: to_day)
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

      base_scope(from_day: from_day, to_day: to_day)
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

    def realtime_totals(from_day:, to_day:, last_aggregated_at: nil)
      aggregated_available = aggregated_data_available?(from_day: from_day, to_day: to_day)
      aggregated_totals = aggregated_available ? (totals(from_day: from_day, to_day: to_day) || empty_totals) : empty_totals

      fallback_totals = analytics_event_totals(
        from_time: analytics_event_start_time(
          from_day: from_day,
          aggregated_available: aggregated_available,
          last_aggregated_at: last_aggregated_at
        ),
        to_time: to_day.end_of_day
      )

      merged = merge_totals(aggregated_totals, fallback_totals)
      [merged, resolve_data_source(aggregated_available: aggregated_available, fallback_present: totals_present?(fallback_totals))]
    end

    def realtime_timeseries(days:, last_aggregated_at: nil)
      from_day = days.to_i.days.ago.to_date
      to_day = Date.current
      aggregated_available = aggregated_data_available?(from_day: from_day, to_day: to_day)
      aggregated_series = aggregated_available ? timeseries(days: days) : []

      fallback_series = analytics_event_timeseries(
        from_time: analytics_event_start_time(
          from_day: from_day,
          aggregated_available: aggregated_available,
          last_aggregated_at: last_aggregated_at
        ),
        to_time: to_day.end_of_day
      )

      merged = merge_timeseries(aggregated_series, fallback_series)
      [merged, resolve_data_source(aggregated_available: aggregated_available, fallback_present: fallback_series.any?)]
    end

    private

    def base_scope(from_day: nil, to_day: nil)
      scope = CompanyDailyStat.where(company_id: @company_id)
      return scope unless from_day.present? && to_day.present?

      scope.where(day: from_day..to_day)
    end

    def analytics_event_scope(from_time:, to_time:)
      AnalyticsEvent.where(
        company_id: @company_id,
        tracked_at: from_time..to_time,
        event_type: EVENT_TYPE_TO_METRIC.keys
      )
    end

    def analytics_event_totals(from_time:, to_time:)
      return empty_totals unless analytics_events_available?(from_time: from_time, to_time: to_time)

      counts = analytics_event_scope(from_time: from_time, to_time: to_time).group(:event_type).count
      totals = empty_totals

      counts.each do |event_type, count|
        metric = EVENT_TYPE_TO_METRIC[event_type]
        next unless metric

        totals[metric] += count.to_i
      end

      add_cta_type_totals!(totals, from_time: from_time, to_time: to_time)
      totals
    rescue StandardError => e
      Rails.logger.warn("[CompanyDashboard::MetricsSource] analytics_event_totals failed: #{e.class} #{e.message}")
      empty_totals
    end

    def analytics_event_timeseries(from_time:, to_time:)
      return [] unless analytics_events_available?(from_time: from_time, to_time: to_time)

      grouped = analytics_event_scope(from_time: from_time, to_time: to_time)
        .group(Arel.sql('DATE(tracked_at)'), :event_type)
        .count

      rows = Hash.new do |hash, date|
        hash[date] = default_timeseries_row(date)
      end

      grouped.each do |(day_value, event_type), count|
        metric = EVENT_TYPE_TO_METRIC[event_type]
        next unless metric

        day = day_value.to_date
        rows[day][metric] += count.to_i
      end

      add_cta_type_timeseries!(rows, from_time: from_time, to_time: to_time)
      rows.values.sort_by { |row| row[:date] }
    rescue StandardError => e
      Rails.logger.warn("[CompanyDashboard::MetricsSource] analytics_event_timeseries failed: #{e.class} #{e.message}")
      []
    end

    def analytics_event_start_time(from_day:, aggregated_available:, last_aggregated_at:)
      return from_day.beginning_of_day unless aggregated_available
      return nil if last_aggregated_at.blank?

      [from_day.beginning_of_day, last_aggregated_at].max
    end

    def add_cta_type_totals!(totals, from_time:, to_time:)
      cta_type_counts(from_time: from_time, to_time: to_time).each do |cta_type, count|
        metric = CTA_TYPE_TO_METRIC[cta_type.to_s]
        next unless metric

        totals[metric] += count.to_i
      end
    end

    def add_cta_type_timeseries!(rows, from_time:, to_time:)
      cta_type_timeseries_counts(from_time: from_time, to_time: to_time).each do |(day_value, cta_type), count|
        metric = CTA_TYPE_TO_METRIC[cta_type.to_s]
        next unless metric

        day = day_value.to_date
        rows[day][metric] += count.to_i
      end
    end

    def cta_type_counts(from_time:, to_time:)
      expression = metadata_cta_type_expression
      return {} if expression.blank?

      analytics_event_scope(from_time: from_time, to_time: to_time)
        .where(event_type: CTA_CLICK_EVENTS)
        .group(Arel.sql(expression))
        .count
        .reject { |cta_type, _count| cta_type.blank? }
    end

    def cta_type_timeseries_counts(from_time:, to_time:)
      expression = metadata_cta_type_expression
      return {} if expression.blank?

      analytics_event_scope(from_time: from_time, to_time: to_time)
        .where(event_type: CTA_CLICK_EVENTS)
        .group(Arel.sql('DATE(tracked_at)'), Arel.sql(expression))
        .count
        .reject { |(_day, cta_type), _count| cta_type.blank? }
    end

    def metadata_cta_type_expression
      adapter = ActiveRecord::Base.connection.adapter_name.downcase
      return "metadata->>'cta_type'" if adapter.include?('postgres')
      return "json_extract(metadata, '$.cta_type')" if adapter.include?('sqlite')

      nil
    end

    def merge_totals(primary, delta)
      TOTAL_KEYS.each_with_object(empty_totals) do |key, totals|
        totals[key] = primary[key].to_i + delta[key].to_i
      end
    end

    def merge_timeseries(primary, delta)
      rows = {}

      primary.each do |row|
        rows[row[:date].to_date] = default_timeseries_row(row[:date]).merge(
          row.transform_values { |value| value.is_a?(Numeric) ? value.to_i : value }
        )
      end

      delta.each do |row|
        key = row[:date].to_date
        rows[key] ||= default_timeseries_row(row[:date])

        EVENT_TYPE_TO_METRIC.values.uniq.each do |metric|
          rows[key][metric] += row[metric].to_i
        end
      end

      rows.values.sort_by { |row| row[:date] }
    end

    def resolve_data_source(aggregated_available:, fallback_present:)
      return 'company_daily_stats+analytics_events_realtime' if aggregated_available && fallback_present
      return 'company_daily_stats' if aggregated_available
      return 'analytics_events_fallback' if fallback_present

      'company_daily_stats_unavailable'
    end

    def analytics_events_available?(from_time:, to_time:)
      from_time.present? &&
        to_time.present? &&
        ActiveRecord::Base.connection.table_exists?('analytics_events')
    end

    def totals_present?(totals)
      TOTAL_KEYS.any? { |key| totals[key].to_i.positive? }
    end

    def empty_totals
      TOTAL_KEYS.each_with_object({}) { |key, totals| totals[key] = 0 }
    end

    def default_timeseries_row(day)
      {
        date: day.to_date,
        profile_views: 0,
        cta_clicks: 0,
        whatsapp_clicks: 0,
        email_clicks: 0,
        phone_clicks: 0,
        website_clicks: 0,
        leads: 0
      }
    end
  end
end
