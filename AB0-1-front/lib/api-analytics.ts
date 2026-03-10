// =======================
// Analytics API Integration
// =======================
import { fetchApi } from './api';
import {
  isQueuedOfflineMutationResult,
  sendJsonApiMutationWithOfflineQueue,
} from './offline/apiMutation';

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

export type VerificationStatus = 'declared' | 'verified' | 'calculated';

export interface CompanyClaim {
  key:
    | 'projects_delivered'
    | 'installed_capacity_kwp'
    | 'years_in_market'
    | 'ev_projects'
    | 'commercial_projects'
    | 'impact_co2'
    | 'impact_economy';
  value: number | string;
  status: VerificationStatus;
  updated_at: string;
  evidence?: string[];
}

export interface PublicVisibilityToggles {
  rating_reviews_public: boolean;
  verification_public: boolean;
  response_time_public: boolean;
  response_band?: '1h' | '4h' | '24h' | '48h' | '48h_plus';
  claims_public: {
    projects_delivered: boolean;
    installed_capacity_kwp: boolean;
    years_in_market: boolean;
    ev_projects: boolean;
    commercial_projects: boolean;
    impact_co2: boolean;
    impact_economy: boolean;
  };
}

export interface CompanyAnalyticsSettings {
  collection_modes: {
    automatic_tracking: boolean;
    declared_input: boolean;
    integrated_sources: {
      utm: boolean;
      crm_import: boolean;
      ga4_meta_ads: boolean;
    };
  };
  public_visibility: PublicVisibilityToggles;
  claims: CompanyClaim[];
}

type AnalyticsAvailability = {
  available: boolean;
  reason?: string;
  status?: number;
  checkedAt: number;
  expiresAt: number;
};

const ANALYTICS_CACHE_TTL_MS = 10 * 60 * 1000;
const ANALYTICS_UNAUTH_TTL_MS = 60 * 1000;
const analyticsAvailability = new Map<number, AnalyticsAvailability>();

const getAvailability = (companyId: number): AnalyticsAvailability | null => {
  const cached = analyticsAvailability.get(companyId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    analyticsAvailability.delete(companyId);
    return null;
  }
  return cached;
};

const setAvailability = (
  companyId: number,
  available: boolean,
  reason?: string,
  status?: number,
  ttlMs: number = ANALYTICS_CACHE_TTL_MS
) => {
  analyticsAvailability.set(companyId, {
    available,
    reason,
    status,
    checkedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
};

async function requestAnalytics<T>(
  companyId: number,
  label: string,
  requestFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!companyId) return fallback;

  const cached = getAvailability(companyId);
  if (cached && cached.available === false) {
    console.info('[analyticsApi] Skipping request due to cached unavailability', {
      label,
      companyId,
      reason: cached.reason,
      status: cached.status,
      expiresAt: cached.expiresAt,
    });
    return fallback;
  }

  try {
    const data = await requestFn();
    setAvailability(companyId, true, 'ok', 200, ANALYTICS_CACHE_TTL_MS);
    return data;
  } catch (error: any) {
    const status = error?.status || error?.context?.status;
    const reason =
      status === 404 ? 'route_not_found' : status === 401 || status === 403 ? 'unauthorized' : 'error';
    const ttl = status === 401 || status === 403 ? ANALYTICS_UNAUTH_TTL_MS : ANALYTICS_CACHE_TTL_MS;

    if (status === 404 || status === 401 || status === 403) {
      setAvailability(companyId, false, reason, status, ttl);
    }

    console.warn('[analyticsApi] Request failed, using fallback', {
      label,
      companyId,
      status,
      reason,
    });
    return fallback;
  }
}

async function validateAnalyticsRoutes(companyId: number): Promise<boolean> {
  if (!companyId) return false;
  const cached = getAvailability(companyId);
  if (cached) return cached.available;

  try {
    await fetchApi<{ data: any[] }>(
      `/companies/${companyId}/analytics/historical`,
      {
        params: { days: 1 },
        retries: 0,
        silentStatusCodes: [401, 403, 404],
        tag: 'analytics.validate',
      }
    );
    setAvailability(companyId, true, 'ok', 200, ANALYTICS_CACHE_TTL_MS);
    return true;
  } catch (error: any) {
    const status = error?.status || error?.context?.status;
    const reason =
      status === 404 ? 'route_not_found' : status === 401 || status === 403 ? 'unauthorized' : 'error';
    const ttl = status === 401 || status === 403 ? ANALYTICS_UNAUTH_TTL_MS : ANALYTICS_CACHE_TTL_MS;

    if (status === 404 || status === 401 || status === 403) {
      setAvailability(companyId, false, reason, status, ttl);
    }

    console.warn('[analyticsApi] Validation failed', {
      companyId,
      status,
      reason,
    });
    return false;
  }
}

// =======================
// Analytics API Endpoints
// =======================
export const analyticsApi = {
  validateRoutes: validateAnalyticsRoutes,
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
    return requestAnalytics(
      companyId,
      'historical',
      async () => {
        const response = await fetchApi<{ data: any[] }>(
          `/companies/${companyId}/analytics/historical`,
          {
            params: { days },
            retries: 1, // avoid noisy retries for missing endpoints
            silentStatusCodes: [401, 403, 404],
            tag: 'analytics.historical',
          }
        );
        const data = response?.data || [];
        return data.map((row) => ({
          date: row.date,
          views: row.views ?? 0,
          clicks: row.clicks ?? 0,
          leads: row.leads ?? 0,
          conversion: row.conversion ?? 0,
        }));
      },
      []
    );
  },

  // Get review analytics
  getReviewAnalytics: async (companyId: number): Promise<ReviewAnalytics> => {
    const fallback = {
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recent_reviews: [],
    };
    return requestAnalytics(
      companyId,
      'reviews',
      async () => {
        const response = await fetchApi<ReviewAnalytics>(
          `/companies/${companyId}/analytics/reviews`,
          {
            retries: 1,
            silentStatusCodes: [401, 403, 404],
            tag: 'analytics.reviews',
          }
        );
        return response;
      },
      fallback
    );
  },

  // Settings: get
  getAnalyticsSettings: async (
    companyId: number
  ): Promise<CompanyAnalyticsSettings> => {
    const storageKey = `analytics_settings_company_${companyId}`;
    try {
      const response = await fetchApi<{ settings: CompanyAnalyticsSettings }>(
        `/companies/${companyId}/analytics/settings`
      );
      const settings = response.settings;
      if (settings) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(settings));
        } catch {}
      }
      return (
        settings ||
        JSON.parse(localStorage.getItem(storageKey) || 'null') ||
        defaultAnalyticsSettings()
      );
    } catch (error) {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) return JSON.parse(cached);
      } catch {}
      return defaultAnalyticsSettings();
    }
  },

  // Settings: update
  updateAnalyticsSettings: async (
    companyId: number,
    settings: CompanyAnalyticsSettings
  ): Promise<CompanyAnalyticsSettings> => {
    const storageKey = `analytics_settings_company_${companyId}`;
    try {
      const response = await fetchApi<{ settings: CompanyAnalyticsSettings }>(
        `/companies/${companyId}/analytics/settings`,
        {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        }
      );
      const updated = response.settings || settings;
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    } catch (error) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(settings));
      } catch {}
      return settings;
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
    return requestAnalytics(
      companyId,
      'traffic',
      async () => {
        const response = await fetchApi<{ sources: TrafficSource[] }>(
          `/companies/${companyId}/analytics/traffic`,
          {
            params: { days },
            retries: 1, // avoid retry loop on 404/502
            silentStatusCodes: [401, 403, 404],
            tag: 'analytics.traffic',
          }
        );
        return response.sources || [];
      },
      []
    );
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
    event_type: 'view' | 'click' | 'lead' | 'whatsapp_click' | 'badge_cta_click' | 'badge_cta_view' | 'badges_tab_open' | string;
    metadata?: Record<string, any>;
  }): Promise<void> => {
    try {
      await sendJsonApiMutationWithOfflineQueue('/analytics/track', {
        method: 'POST',
        body: eventData,
        conflictKey: `analytics:event:${eventData.event_type}:${eventData.company_id}`,
        metadata: {
          queue: 'analytics-track-event',
          eventType: eventData.event_type,
        },
      });
    } catch (error) {
      // Silence logs for 500 errors to avoid console noise
      // console.error('[analyticsApi.trackEvent] Error:', error);
    }
  },

  // Conversion metrics grouped by event_type
  getConversionMetrics: async (companyId: number, days = 30): Promise<{ metrics: Record<string, number>; daily: Record<string, number> }> => {
    try {
      const response = await fetchApi<{ metrics: Record<string, number>; daily: Record<string, number> }>(
        '/analytics/conversions',
        { params: { company_id: companyId, days } }
      );
      return response;
    } catch (error) {
      console.error('[analyticsApi.getConversionMetrics] Error:', error);
      return { metrics: {}, daily: {} };
    }
  },

  // Track banner-specific events
  trackBannerEvent: async (payload: {
    banner_id: number;
    company_id?: number;
    event_type: 'view' | 'click';
    utm?: Record<string, any>;
    metadata?: Record<string, any>;
    tracked_at?: string;
  }): Promise<void> => {
    try {
      const response = await sendJsonApiMutationWithOfflineQueue('/banner_events', {
        method: 'POST',
        body: { banner_event: payload },
        conflictKey: `banner:${payload.banner_id}:${payload.event_type}`,
        metadata: {
          queue: 'banner-events',
          eventType: payload.event_type,
          bannerId: payload.banner_id,
        },
      });

      if (isQueuedOfflineMutationResult(response)) {
        return;
      }
    } catch (error) {
      console.error('[analyticsApi.trackBannerEvent] Error:', error);
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

function defaultAnalyticsSettings(): CompanyAnalyticsSettings {
  return {
    collection_modes: {
      automatic_tracking: true,
      declared_input: true,
      integrated_sources: {
        utm: true,
        crm_import: false,
        ga4_meta_ads: false,
      },
    },
    public_visibility: {
      rating_reviews_public: true,
      verification_public: true,
      response_time_public: true,
      response_band: '1h',
      claims_public: {
        projects_delivered: true,
        installed_capacity_kwp: true,
        years_in_market: true,
        ev_projects: false,
        commercial_projects: true,
        impact_co2: false,
        impact_economy: false,
      },
    },
    claims: [],
  };
}

// Export all functions
export default analyticsApi;
