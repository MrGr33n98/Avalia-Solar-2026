// =======================
// Analytics API Integration
// =======================
import { fetchApi } from './api';

export interface CompanyAnalytics {
  profile_views: number;
  cta_clicks: number;
  whatsapp_clicks: number;
  leads_received: number;
  reviews_count: number;
  average_rating: number;
  pending_approvals: number;
  active_campaigns: number;
  conversion_rate: number;
}

export interface HistoricalData {
  date: string;
  views: number;
  clicks: number;
  leads: number;
  conversion: number;
}

export interface ReviewAnalytics {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recent_reviews: Array<{
    id: number;
    rating: number;
    comment: string;
    user_name: string;
    created_at: string;
    verified: boolean;
  }>;
  sentiment_analysis?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface CompetitorMetrics {
  company_id: number;
  company_name: string;
  rating: number;
  reviews_count: number;
  market_position: number;
  category_share: number;
}

export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
  conversion_rate: number;
}

export interface CampaignPerformance {
  id: number;
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roi: number;
  status: 'active' | 'paused' | 'completed';
}

// =======================
// Analytics API Endpoints
// =======================
export const analyticsApi = {
  // Get company dashboard stats
  getStats: async (companyId?: number): Promise<CompanyAnalytics> => {
    try {
      const response = await fetchApi<{ stats: CompanyAnalytics }>(
        '/company_dashboard/stats',
        companyId ? { params: { company_id: companyId } } : undefined
      );
      return response.stats;
    } catch (error) {
      console.error('[analyticsApi.getStats] Error:', error);
      return {
        profile_views: 0,
        cta_clicks: 0,
        whatsapp_clicks: 0,
        leads_received: 0,
        reviews_count: 0,
        average_rating: 0,
        pending_approvals: 0,
        active_campaigns: 0,
        conversion_rate: 0,
      };
    }
  },

  // Get historical data for charts
  getHistoricalData: async (
    companyId: number,
    days: number = 30
  ): Promise<HistoricalData[]> => {
    try {
      const response = await fetchApi<{ data: HistoricalData[] }>(
        `/companies/${companyId}/analytics/historical`,
        { params: { days } }
      );
      return response.data;
    } catch (error) {
      console.error('[analyticsApi.getHistoricalData] Error:', error);
      // Return mock data for development
      return generateMockHistoricalData(days);
    }
  },

  // Get review analytics
  getReviewAnalytics: async (companyId: number): Promise<ReviewAnalytics> => {
    try {
      const response = await fetchApi<ReviewAnalytics>(
        `/companies/${companyId}/analytics/reviews`
      );
      return response;
    } catch (error) {
      console.error('[analyticsApi.getReviewAnalytics] Error:', error);
      return {
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recent_reviews: [],
      };
    }
  },

  // Get competitor benchmarking
  getCompetitorBenchmark: async (
    companyId: number,
    categoryId: number
  ): Promise<CompetitorMetrics[]> => {
    try {
      const response = await fetchApi<{ competitors: CompetitorMetrics[] }>(
        `/companies/${companyId}/analytics/competitors`,
        { params: { category_id: categoryId } }
      );
      return response.competitors;
    } catch (error) {
      console.error('[analyticsApi.getCompetitorBenchmark] Error:', error);
      return [];
    }
  },

  // Get traffic sources
  getTrafficSources: async (
    companyId: number,
    days: number = 30
  ): Promise<TrafficSource[]> => {
    try {
      const response = await fetchApi<{ sources: TrafficSource[] }>(
        `/companies/${companyId}/analytics/traffic`,
        { params: { days } }
      );
      return response.sources;
    } catch (error) {
      console.error('[analyticsApi.getTrafficSources] Error:', error);
      // Return mock data for development
      return [
        { source: 'Busca Orgânica', visits: 450, percentage: 45, conversion_rate: 8.5 },
        { source: 'Direto', visits: 250, percentage: 25, conversion_rate: 12.3 },
        { source: 'Redes Sociais', visits: 180, percentage: 18, conversion_rate: 5.2 },
        { source: 'Referências', visits: 120, percentage: 12, conversion_rate: 6.8 },
      ];
    }
  },

  // Get campaign performance
  getCampaignPerformance: async (companyId: number): Promise<CampaignPerformance[]> => {
    try {
      const response = await fetchApi<{ campaigns: CampaignPerformance[] }>(
        `/companies/${companyId}/campaigns/performance`
      );
      return response.campaigns;
    } catch (error) {
      console.error('[analyticsApi.getCampaignPerformance] Error:', error);
      return [];
    }
  },

  // Track event (for user actions)
  trackEvent: async (eventData: {
    company_id: number;
    event_type: 'view' | 'click' | 'lead' | 'whatsapp_click';
    metadata?: Record<string, any>;
  }): Promise<void> => {
    try {
      await fetchApi('/analytics/track', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    } catch (error) {
      console.error('[analyticsApi.trackEvent] Error:', error);
    }
  },
};

// =======================
// Helper Functions
// =======================

function generateMockHistoricalData(days: number): HistoricalData[] {
  const data: HistoricalData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(80 + Math.random() * 100 + (days - i) * 2),
      clicks: Math.floor(10 + Math.random() * 30 + (days - i) * 0.5),
      leads: Math.floor(2 + Math.random() * 8),
      conversion: Number((5 + Math.random() * 10).toFixed(1)),
    });
  }

  return data;
}

// Export all functions
export default analyticsApi;
