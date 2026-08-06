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
      leads_total = @company.leads.count
      leads_30d = leads_received_last_30d
      
      # Calcula taxa de conversão baseada nos últimos 30 dias para unificar com o desktop
      conversion_rate = calculate_conversion_rate(views: profile_views, leads: leads_30d)

      {
        profile_views: profile_views,
        cta_clicks: cta_clicks,
        whatsapp_clicks: whatsapp_clicks,
        leads_total: leads_total,
        leads_30d: leads_30d,
        leads_received: leads_30d, # Alinha contrato esperado pelo frontend mobile
        marketplace_potential: calculate_marketplace_potential,
        active_categories: format_active_categories,
        reviews_count: reviews_count,
        pending_reviews_count: pending_reviews_count,
        average_rating: safe_count(:rating_avg),
        pending_approvals: pending_approvals_count,
        active_campaigns: active_campaigns_count,
        conversion_rate: conversion_rate,
        data_source: stats_data_source
      }.merge(CompanyDashboard::FreshnessProvider.call)
    end

    private

    def calculate_marketplace_potential
      # Leads in same categories (last 30 days) that were NOT necessarily for this company
      category_ids = @company.categories.pluck(:id)
      leads_in_category = Lead.where(product_vertical: category_ids)
                              .where('created_at > ?', 30.days.ago)
                              .count

      # Leads in same region (City/State)
      leads_in_region = Lead.where(city: @company.city, state: @company.state)
                            .where('created_at > ?', 30.days.ago)
                            .count

      {
        leads_in_category: leads_in_category,
        leads_in_region: leads_in_region,
        market_share_percent: leads_in_category.positive? ? ((leads_received_last_30d.to_f / leads_in_category) * 100).round(1) : 0
      }
    end

    def format_active_categories
      @company.categories.map do |cat|
        {
          id: cat.id,
          name: cat.name,
          views_in_category: 0, # Mocked for now, will use analytics if available
          leads_in_category: Lead.where(product_vertical: cat.id).where('created_at > ?', 30.days.ago).count
        }
      end
    end

    def leads_received_last_30d
      @company.leads.where('leads.created_at > ?', 30.days.ago).count
    end

    def metric_with_fallback(metric_key:, fallback_method:)
      aggregated = daily_stats_totals[metric_key]
      return aggregated.to_i if canonical_metrics_available? && aggregated.present?

      safe_count(fallback_method)
    end

    def daily_stats_totals
      return @daily_stats_totals if defined?(@daily_stats_totals)
      # Filtra pelos últimos 30 dias para unificar as visualizações/cliques com o desktop
      totals = canonical_metrics_available? ? metrics_source.totals(from_day: 30.days.ago.to_date, to_day: Date.current) : nil

      @daily_stats_totals = {
        'profile_views' => totals&.dig(:profile_views),
        'cta_clicks' => totals&.dig(:cta_clicks),
        'whatsapp_clicks' => totals&.dig(:whatsapp_clicks)
      }
    end

    def canonical_metrics_available?
      return @canonical_metrics_available if defined?(@canonical_metrics_available)

      @canonical_metrics_available =
        metrics_source.available? && CompanyDailyStat.where(company_id: @company.id).exists?
    end

    def metrics_source
      @metrics_source ||= MetricsSource.new(company_id: @company&.id)
    end

    def stats_data_source
      canonical_metrics_available? ? 'company_daily_stats' : 'company_denormalized_fallback'
    end

    def safe_count(method)
      @company.respond_to?(method) ? (@company.send(method) || 0) : 0
    end

    def reviews_count
      count = @company.respond_to?(:reviews_count) ? (@company.reviews_count || 0) : @company.reviews.size
      [count, 0].max
    end

    def pending_reviews_count
      return 0 unless @company.respond_to?(:reviews)
      @company.reviews.where(reply: nil).or(@company.reviews.where.not(reply_deleted_at: nil)).count
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
        leads_total: 0,
        leads_30d: 0,
        reviews_count: 0,
        pending_reviews_count: 0,
        average_rating: 0,
        pending_approvals: 0,
        active_campaigns: 0,
        conversion_rate: 0,
        data_source: 'company_unavailable'
      }.merge(CompanyDashboard::FreshnessProvider.call)
    end
  end
end
