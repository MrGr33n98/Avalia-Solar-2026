// ============================================
// OPTIMIZED DASHBOARD API SERVICE
// Dara Agent (@data-engineer) - Performance Enhancement
// ============================================

import { getApiBaseUrl, getApiRequestHeaders, buildApiUrl } from '../../../lib/api-config';
import { ApiError, toApiError } from '../../../lib/api-error';

// ============================================
// ENHANCED TYPE DEFINITIONS
// ============================================

export interface OptimizedDashboardStats {
  total_companies: {
    value: number;
    change: number;
    label: string;
  };
  total_reviews: {
    value: number;
    change: number;
    label: string;
  };
  total_leads: {
    value: number;
    change: number;
    label: string;
  };
  pipeline_value: {
    value: number;
    change: number;
    label: string;
  };
  performance_metrics: {
    global_avg_rating: number;
    leads_per_company: number;
    reviews_per_company: number;
    company_growth_rate: number;
  };
  last_updated: string;
}

export interface DashboardChartData {
  date: string;
  value: number;
  cumulative?: number;
  label?: string;
}

export interface CompanyMetric {
  id: number;
  name: string;
  slug: string;
  total_reviews: number;
  avg_rating: number;
  total_products: number;
  total_leads: number;
  total_pipeline_value: number;
  reviews_last_30d: number;
  leads_last_30d: number;
  cohort_month: string;
}

export interface DashboardPerformanceStats {
  query_type: string;
  total_queries: number;
  avg_execution_time_ms: number;
  max_execution_time_ms: number;
  min_execution_time_ms: number;
  cache_hit_rate: number;
  avg_rows_returned: number;
}

// ============================================
// PERFORMANCE MONITORING UTILITIES
// ============================================

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private performanceLogs: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(queryType: string): string {
    const timerId = `${queryType}_${Date.now()}_${Math.random()}`;
    const startTime = performance.now();
    
    // Store start time with timer ID
    if (!this.performanceLogs.has(timerId)) {
      this.performanceLogs.set(timerId, [startTime]);
    }
    
    return timerId;
  }

  endTimer(timerId: string): number {
    const endTime = performance.now();
    const times = this.performanceLogs.get(timerId);
    
    if (times && times.length === 1) {
      const executionTime = Math.round(endTime - times[0]);
      this.performanceLogs.delete(timerId); // Cleanup
      return executionTime;
    }
    
    return 0;
  }

  async logPerformance(queryType: string, executionTime: number, rowsReturned?: number, cacheHit: boolean = false) {
    try {
      // Log to backend for analysis
      await fetch(buildApiUrl('/api/v1/dashboard/performance/log'), {
        method: 'POST',
        headers: getApiRequestHeaders(),
        body: JSON.stringify({
          query_type: queryType,
          execution_time_ms: executionTime,
          rows_returned: rowsReturned,
          cache_hit: cacheHit,
        }),
      });
    } catch (error) {
      // Don't throw - performance logging is optional
      console.warn('Performance logging failed:', error);
    }
  }
}

// ============================================
// CACHE MANAGEMENT
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DashboardCache {
  private static instance: DashboardCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DashboardCache {
    if (!DashboardCache.instance) {
      DashboardCache.instance = new DashboardCache();
    }
    return DashboardCache.instance;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// ============================================
// OPTIMIZED API SERVICE
// ============================================

export class OptimizedDashboardAPI {
  private static instance: OptimizedDashboardAPI;
  private performance = PerformanceMonitor.getInstance();
  private cache = DashboardCache.getInstance();

  static getInstance(): OptimizedDashboardAPI {
    if (!OptimizedDashboardAPI.instance) {
      OptimizedDashboardAPI.instance = new OptimizedDashboardAPI();
    }
    return OptimizedDashboardAPI.instance;
  }

  /**
   * Get optimized dashboard statistics
   * Uses materialized views and database functions for sub-100ms response times
   */
  async getDashboardStats(): Promise<OptimizedDashboardStats> {
    const cacheKey = 'dashboard_stats';
    const cached = this.cache.get<OptimizedDashboardStats>(cacheKey);
    
    if (cached) {
      await this.performance.logPerformance('dashboard_stats', 0, undefined, true);
      return cached;
    }

    const timerId = this.performance.startTimer('dashboard_stats');
    
    try {
      const response = await fetch(buildApiUrl('/api/v1/dashboard/stats/optimized'), {
        method: 'GET',
        headers: getApiRequestHeaders(),
      });

      if (!response.ok) {
        throw toApiError(response);
      }

      const data = await response.json();
      
      // Cache with 5-minute TTL
      this.cache.set(cacheKey, data, 5 * 60 * 1000);
      
      const executionTime = this.performance.endTimer(timerId);
      await this.performance.logPerformance('dashboard_stats', executionTime, 1, false);
      
      return data;
    } catch (error) {
      const executionTime = this.performance.endTimer(timerId);
      await this.performance.logPerformance('dashboard_stats', executionTime, 0, false);
      throw error;
    }
  }

  /**
   * Get optimized chart data for time-series visualizations
   */
  async getChartData(
    metricType: 'companies' | 'reviews' | 'leads' | 'revenue' = 'companies',
    timeRange: 'daily' | 'weekly' | 'monthly' = 'monthly',
    startDate?: string
  ): Promise<DashboardChartData[]> {
    const cacheKey = `chart_data_${metricType}_${timeRange}_${startDate || 'default'}`;
    const cached = this.cache.get<DashboardChartData[]>(cacheKey);
    
    if (cached) {
      await this.performance.logPerformance('chart_data', 0, cached.length, true);
      return cached;
    }

    const timerId = this.performance.startTimer('chart_data');
    
    try {
      const params = new URLSearchParams({
        metric_type: metricType,
        time_range: timeRange,
        ...(startDate && { start_date: startDate }),
      });

      const response = await fetch(buildApiUrl(`/api/v1/dashboard/charts/optimized?${params}`), {
        method: 'GET',
        headers: getApiRequestHeaders(),
      });

      if (!response.ok) {
        throw toApiError(response);
      }

      const data = await response.json();
      
      // Cache with 10-minute TTL for chart data
      this.cache.set(cacheKey, data, 10 * 60 * 1000);
      
      const executionTime = this.performance.endTimer(timerId);
      await this.performance.logPerformance('chart_data', executionTime, data.length, false);
      
      return data;
    } catch (error) {
      const executionTime = this.performance.endTimer(timerId);
      await this.performance.logPerformance('chart_data', executionTime, 0, false);
      throw error;
    }
  }

  /**
   * Get top performing companies with pagination
   */
  async getTopCompanies(
    sortBy: 'total_leads' | 'avg_rating' | 'total_reviews' | 'total_pipeline_value' = 'total_leads',
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    companies: CompanyMetric[];
    total: number;
    hasMore: boolean;
  }> {
    const cacheKey = `top_companies_${sortBy}_${limit}_${offset}`;
    const cached = this.cache.get<{companies: CompanyMetric[], total: number, hasMore: boolean}>(cacheKey);
    
    if (cached) {
      await this.performance.logPerformance('top_companies', 0, cached.companies.length, true);
      return cached;
    }

    const timerId = this.performance.startTimer('top_companies');
    
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(buildApiUrl(`/api/v1/dashboard/companies/top?${params}`), {
        method: 'GET',
        headers: getApiRequestHeaders(),
      });

      if (!response.ok) {
        throw toApiError(response);
      }

      const data = await response.json();
      
      // Cache with 15-minute TTL for company rankings
      this.cache.set(cacheKey, data, 15 * 60 * 1000);
      
      const executionTime = this.performance.endTimer(timerId);
      await this.performance.logPerformance('top_companies', executionTime, data.companies.length, false);
      
      return data;
    } catch (error) {
      const executionTime = this.performance.endTimer(timerId);
      await this.performance.logPerformance('top_companies', executionTime, 0, false);
      throw error;
    }
  }

  /**
   * Get real-time performance statistics
   */
  async getPerformanceStats(): Promise<DashboardPerformanceStats[]> {
    const cacheKey = 'performance_stats';
    const cached = this.cache.get<DashboardPerformanceStats[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(buildApiUrl('/api/v1/dashboard/performance/stats'), {
        method: 'GET',
        headers: getApiRequestHeaders(),
      });

      if (!response.ok) {
        throw toApiError(response);
      }

      const data = await response.json();
      
      // Cache with 1-minute TTL for performance stats
      this.cache.set(cacheKey, data, 60 * 1000);
      
      return data;
    } catch (error) {
      console.warn('Failed to fetch performance stats:', error);
      return [];
    }
  }

  /**
   * Manually refresh materialized views
   * Use with caution - this can be expensive
   */
  async refreshViews(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(buildApiUrl('/api/v1/dashboard/refresh'), {
        method: 'POST',
        headers: getApiRequestHeaders(),
      });

      if (!response.ok) {
        throw toApiError(response);
      }

      // Clear all cached data after refresh
      this.cache.clear();
      
      return await response.json();
    } catch (error) {
      console.error('Failed to refresh views:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.cache.getStats();
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const optimizedDashboardApi = OptimizedDashboardAPI.getInstance();

// ============================================
// REACT QUERY INTEGRATION
// ============================================

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  charts: () => [...dashboardQueryKeys.all, 'charts'] as const,
  chartData: (metricType: string, timeRange: string, startDate?: string) => 
    [...dashboardQueryKeys.charts(), metricType, timeRange, startDate] as const,
  companies: () => [...dashboardQueryKeys.all, 'companies'] as const,
  topCompanies: (sortBy: string, limit: number, offset: number) =>
    [...dashboardQueryKeys.companies(), 'top', sortBy, limit, offset] as const,
  performance: () => [...dashboardQueryKeys.all, 'performance'] as const,
};

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Basic usage
const api = optimizedDashboardApi;

// Get dashboard stats
const stats = await api.getDashboardStats();

// Get chart data
const chartData = await api.getChartData('companies', 'monthly');

// Get top companies
const topCompanies = await api.getTopCompanies('total_leads', 10);

// Performance monitoring
const perfStats = await api.getPerformanceStats();

// Cache management
const cacheStats = api.getCacheStats();
api.clearCache();

// React Query integration
const { data: dashboardStats } = useQuery({
  queryKey: dashboardQueryKeys.stats(),
  queryFn: () => optimizedDashboardApi.getDashboardStats(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 15 * 60 * 1000, // 15 minutes
});
*/