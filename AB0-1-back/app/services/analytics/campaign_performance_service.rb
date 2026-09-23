# frozen_string_literal: true

module Analytics
  class CampaignPerformanceService
    PROFILE_VIEW_EVENTS = %w[profile_view Company\ Profile\ Viewed company_profile_viewed].freeze
    CTA_CLICK_EVENTS = %w[
      cta_click
      CTA\ Clicked
      cta_clicked
      company_cta_clicked
      company_cta_quote
    ].freeze
    LEAD_EVENTS = %w[lead_created Lead\ Form\ Submitted].freeze

    CampaignRow = Struct.new(
      :utm_source,
      :utm_medium,
      :utm_campaign,
      :total_visits,
      :total_cta_clicks,
      :total_leads,
      :last_seen_at,
      keyword_init: true
    ) do
      def conversion_rate
        return 0.0 if total_visits.to_i.zero?

        ((total_leads.to_f / total_visits) * 100).round(2)
      end

      def as_json(*)
        {
          utm_campaign: utm_campaign,
          utm_source: utm_source,
          utm_medium: utm_medium,
          total_visits: total_visits,
          total_cta_clicks: total_cta_clicks,
          total_leads: total_leads,
          conversion_rate: conversion_rate,
          last_seen_at: last_seen_at
        }
      end
    end

    def self.call(company_id:, from_time:, to_time:, limit: 5)
      new(company_id: company_id, from_time: from_time, to_time: to_time, limit: limit).call
    end

    def initialize(company_id:, from_time:, to_time:, limit: 5)
      @company_id = company_id
      @from_time = from_time
      @to_time = to_time
      @limit = limit
    end

    def call
      rows = {}

      scoped_events.find_each do |event|
        metadata = event.metadata.is_a?(Hash) ? event.metadata.stringify_keys : {}
        key = [
          metadata['utm_source'],
          metadata['utm_medium'],
          metadata['utm_campaign']
        ]

        rows[key] ||= CampaignRow.new(
          utm_source: metadata['utm_source'],
          utm_medium: metadata['utm_medium'],
          utm_campaign: metadata['utm_campaign'],
          total_visits: 0,
          total_cta_clicks: 0,
          total_leads: 0,
          last_seen_at: nil
        )

        row = rows[key]
        row.last_seen_at = [row.last_seen_at, event.tracked_at].compact.max
        row.total_visits += 1 if PROFILE_VIEW_EVENTS.include?(event.event_type)
        row.total_cta_clicks += 1 if CTA_CLICK_EVENTS.include?(event.event_type)
        row.total_leads += 1 if LEAD_EVENTS.include?(event.event_type)
      end

      rows.values
          .sort_by { |row| [-row.total_leads, -row.total_cta_clicks, -row.total_visits, row.utm_campaign.to_s] }
          .first(@limit)
    end

    private

    def scoped_events
      AnalyticsEvent
        .where(company_id: @company_id, tracked_at: @from_time..@to_time)
        .where(event_type: PROFILE_VIEW_EVENTS + CTA_CLICK_EVENTS + LEAD_EVENTS)
        .where("#{utm_source_expression} IS NOT NULL AND #{utm_source_expression} != ''")
    end

    def utm_source_expression
      adapter = ActiveRecord::Base.connection.adapter_name.downcase
      return "metadata->>'utm_source'" if adapter.include?('postgres')
      return "json_extract(metadata, '$.utm_source')" if adapter.include?('sqlite')

      "NULL"
    end
  end
end
