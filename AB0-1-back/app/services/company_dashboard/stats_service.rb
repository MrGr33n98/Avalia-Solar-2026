module CompanyDashboard
  class StatsService
    def initialize(company)
      @company = company
    end

    def call
      return default_stats unless @company

      profile_views = metric_with_fallback(
        metric_key: 'profile_views',
        fallback_method: :profile_views_count
      )
      cta_clicks = metric_with_fallback(
        metric_key: 'cta_clicks',
        fallback_method: :cta_clicks_count
      )
      whatsapp_clicks = metric_with_fallback(
        metric_key: 'whatsapp_clicks',
        fallback_method: :whatsapp_clicks_count
      )
      leads_received = @company.leads.count
      conversion_rate = calculate_conversion_rate(views: profile_views, leads: leads_received)

      {
        profile_views: profile_views,
        cta_clicks: cta_clicks,
        whatsapp_clicks: whatsapp_clicks,
        leads_received: leads_received,
        reviews_count: reviews_count,
        average_rating: safe_count(:rating_avg),
        pending_approvals: pending_approvals_count,
        active_campaigns: active_campaigns_count,
        conversion_rate: conversion_rate
      }.merge(CompanyDashboard::FreshnessProvider.call)
    end

    private

    def metric_with_fallback(metric_key:, fallback_method:)
      aggregated = daily_stats_totals[metric_key]
      return aggregated.to_i if aggregated.present?

      safe_count(fallback_method)
    end

    def daily_stats_totals
      return @daily_stats_totals if defined?(@daily_stats_totals)
      source = MetricsSource.new(company_id: @company&.id)
      totals = source.totals

      @daily_stats_totals = {
        'profile_views' => totals&.dig(:profile_views),
        'cta_clicks' => totals&.dig(:cta_clicks),
        'whatsapp_clicks' => totals&.dig(:whatsapp_clicks)
      }
    end

    def safe_count(method)
      @company.respond_to?(method) ? (@company.send(method) || 0) : 0
    end

    def reviews_count
      @company.respond_to?(:reviews_count) ? (@company.reviews_count || 0) : @company.reviews.size
    end

    def pending_approvals_count
      if @company.respond_to?(:pending_changes) && @company.pending_changes.respond_to?(:pending)
        @company.pending_changes.pending.count
      else
        0
      end
    end

    def active_campaigns_count
      return 0 unless @company.respond_to?(:campaigns)

      campaigns = @company.campaigns
      return 0 unless campaigns

      campaigns.respond_to?(:active) ? campaigns.active.count : campaigns.count
    end

    def calculate_conversion_rate(views:, leads:)
      return 0 if views.zero?

      ((leads.to_f / views) * 100).round(2)
    end

    def default_stats
      {
        profile_views: 0,
        cta_clicks: 0,
        whatsapp_clicks: 0,
        leads_received: 0,
        reviews_count: 0,
        average_rating: 0,
        pending_approvals: 0,
        active_campaigns: 0,
        conversion_rate: 0
      }.merge(CompanyDashboard::FreshnessProvider.call)
    end
  end
end
