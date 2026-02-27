# app/services/admin_dashboard_service.rb

class AdminDashboardService
  CACHE_DURATION = 5.minutes

  def call
    {
      metrics: cached_metrics,
      rankings: cached_rankings,
      recent_activity: cached_activity
    }
  end

  private

  def cached_metrics
    Rails.cache.fetch('admin:dashboard:metrics', expires_in: CACHE_DURATION) do
      calculate_metrics
    end
  end

  def cached_rankings
    Rails.cache.fetch('admin:dashboard:rankings', expires_in: CACHE_DURATION) do
      calculate_rankings
    end
  end

  def cached_activity
    Rails.cache.fetch('admin:dashboard:activity', expires_in: 1.minute) do
      fetch_recent_activity
    end
  end

  def calculate_metrics
    {
      total_companies: Company.count,
      active_companies: Company.where(status: 'active').count,
      pending_reviews: Review.where(status: 'pending').count,
      total_leads: Lead.count,
      leads_by_status: Lead.group(:status).count,
      avg_rating: Review.average(:rating).to_f.round(2)
    }
  end

  def calculate_rankings
    Company
      .joins(:reviews)
      .group('companies.id')
      .select('companies.id, companies.name, AVG(reviews.rating) as avg_rating')
      .order('avg_rating DESC')
      .limit(10)
      .map { |c| { name: c.name, rating: c.avg_rating.round(2) } }
  end

  def fetch_recent_activity
    {
      recent_leads: Lead.order(created_at: :desc).limit(10),
      recent_reviews: Review.order(created_at: :desc).limit(10)
    }
  end
end
