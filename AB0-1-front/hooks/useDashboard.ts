'use client';

import { useState, useEffect } from 'react';
import { dashboardApi, DashboardStats } from '@/lib/api';

export interface ExtendedDashboardStats {
  companies_count: number;
  products_count: number;
  leads_count: number;
  reviews_count: number;
  active_campaigns: number;
  monthly_revenue: number;
  average_rating?: number;
  projects_count?: number;
}

export function useDashboard() {
  const [stats, setStats] = useState<ExtendedDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStats();
      
      // Extend the data with additional calculated fields if needed
      const extendedData: ExtendedDashboardStats = {
        ...data,
        // Ensure all fields are present even if API doesn't return them
        companies_count: data.companies_count ?? 0,
        products_count: data.products_count ?? 0,
        leads_count: data.leads_count ?? 0,
        reviews_count: data.reviews_count ?? 0,
        active_campaigns: data.active_campaigns ?? 0,
        monthly_revenue: data.monthly_revenue ?? 0,
      };
      
      setStats(extendedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}