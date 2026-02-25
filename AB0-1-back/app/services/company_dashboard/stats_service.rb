module CompanyDashboard
  class StatsService
    def initialize(company)
      @company = company
    end

    def call
      return default_stats unless @company

      {
        profile_views: safe_count(:profile_views_count) + analytics_count('view'),
        cta_clicks: safe_count(:cta_clicks_count) + analytics_count('click'),
        whatsapp_clicks: safe_count(:whatsapp_clicks_count) + analytics_count('whatsapp_click'),
        leads_received: @company.leads.count,
        reviews_count: reviews_count,
        average_rating: safe_count(:rating_avg),
        pending_approvals: pending_approvals_count,
        active_campaigns: active_campaigns_count,
        conversion_rate: calculate_conversion_rate
      }
    end

    private

    def analytics_count(event_type)
      return 0 unless @company&.id

      AnalyticsEvent.where(company_id: @company.id, event_type: event_type).count
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
      if @company&.campaigns.respond_to?(:active)
        @company.campaigns.active.count
      else
        @company&.campaigns&.count || 0
      end
    end

    def calculate_conversion_rate
      views = safe_count(:profile_views_count) + analytics_count('view')
      leads = @company.leads.count
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
      }
    end
  end
end
