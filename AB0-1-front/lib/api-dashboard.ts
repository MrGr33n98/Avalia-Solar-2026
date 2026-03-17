// Dashboard API Service
import { getApiBaseUrl, getApiRequestHeaders, buildApiUrl } from './api-config';
import { ApiError, toApiError } from './api-error';

// ============================================
// Dashboard Stats Types
// ============================================

export interface DashboardStats {
  companies_count: number;
  products_count: number;
  leads_count: number;
  reviews_count: number;
  active_campaigns: number;
  monthly_revenue: number;
}

export interface DashboardStatsWithChanges {
  total_companies: {
    value: number;
    change: number;
    label: string;
  };
  active_proposals: {
    value: number;
    change: number;
    label: string;
  };
  conversion_rate: {
    value: number;
    change: number;
    label: string;
  };
  total_revenue: {
    value: number;
    change: number;
    label: string;
  };
}

export interface ChartDataPoint {
  month: string;
  value: number;
  label?: string;
}

export interface RecentProposal {
  id: string;
  company: string;
  status: 'Pendente' | 'Aprovado' | 'Em Análise' | 'Rejeitado';
  value: string;
  date: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'company' | 'proposal' | 'review' | 'user';
  title: string;
  description: string;
  time: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Fetch dashboard statistics from backend
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const url = buildApiUrl('/api/v1/dashboard/stats');
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiRequestHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(text || `HTTP ${response.status}`, { status: response.status, url: response.url });
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Dashboard stats error:', error);
    throw error instanceof ApiError ? error : toApiError(error);
  }
}

/**
 * Transform backend stats to dashboard format
 * Note: Calculated from real data. Trends will be implemented when backend supports historical comparisons.
 */
export function transformToDashboardStats(
  stats: DashboardStats,
  previousStats?: DashboardStats
): DashboardStatsWithChanges {
  const calculateChange = (current: number, previous?: number): number => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    total_companies: {
      value: stats.companies_count,
      change: previousStats 
        ? calculateChange(stats.companies_count, previousStats.companies_count)
        : 0,
      label: 'vs mês anterior',
    },
    active_proposals: {
      value: stats.leads_count,
      change: previousStats
        ? calculateChange(stats.leads_count, previousStats.leads_count)
        : 0,
      label: 'vs mês anterior',
    },
    conversion_rate: {
      value: stats.leads_count > 0 
        ? (stats.reviews_count / stats.leads_count) * 100 
        : 0,
      change: 0,
      label: 'vs mês anterior',
    },
    total_revenue: {
      value: stats.monthly_revenue,
      change: 0,
      label: 'vs mês anterior',
    },
  };
}

/**
 * Fetch chart data for dashboard graphs
 * Integrated with real backend data.
 */
export async function fetchDashboardChartData(
  metric: 'companies' | 'revenue' | 'leads',
  period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
): Promise<ChartDataPoint[]> {
  try {
    const url = buildApiUrl(`/api/v1/dashboard/charts/${metric}?period=${period}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiRequestHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[API] Chart endpoint not implemented for ${metric}`);
        return [];
      }
      const text = await response.text();
      throw new ApiError(text || `HTTP ${response.status}`, { status: response.status, url: response.url });
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Dashboard chart data error:', error);
    // Return empty array instead of mock data
    return [];
  }
}

/**
 * Fetch recent proposals for dashboard table
 */
export async function fetchRecentProposals(
  limit: number = 10
): Promise<RecentProposal[]> {
  try {
    const url = buildApiUrl(`/api/v1/leads?limit=${limit}&sort=created_at&order=desc`);
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiRequestHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(text || `HTTP ${response.status}`, { status: response.status, url: response.url });
    }

    const data = await response.json();
    const leads = data.leads || data;

    if (!Array.isArray(leads)) return [];

    return transformLeadsToProposals(leads);
  } catch (error) {
    console.error('[API] Recent proposals error:', error);
    return [];
  }
}

/**
 * Fetch recent activity feed
 */
export async function fetchRecentActivity(
  limit: number = 10
): Promise<RecentActivityItem[]> {
  try {
    const url = buildApiUrl(`/api/v1/dashboard/activity?limit=${limit}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiRequestHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[API] Activity endpoint not implemented');
        return [];
      }
      const text = await response.text();
      throw new ApiError(text || `HTTP ${response.status}`, { status: response.status, url: response.url });
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Recent activity error:', error);
    return [];
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Transform leads data to proposals format
 */
function transformLeadsToProposals(leads: any[]): RecentProposal[] {
  return leads.slice(0, 10).map((lead, index) => ({
    id: lead.id?.toString() || index.toString(),
    company: lead.company_name || lead.name || 'Empresa não identificada',
    status: mapLeadStatusToProposalStatus(lead.status),
    value: formatCurrency(lead.estimated_value || 0),
    date: formatDate(lead.created_at || new Date().toISOString()),
  }));
}

function mapLeadStatusToProposalStatus(status: string): RecentProposal['status'] {
  const statusMap: Record<string, RecentProposal['status']> = {
    new: 'Pendente',
    qualified: 'Em Análise',
    converted: 'Aprovado',
    lost: 'Rejeitado',
  };
  return statusMap[status] || 'Pendente';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

// ============================================
// Export all functions
// ============================================

export const dashboardApi = {
  fetchStats: fetchDashboardStats,
  fetchChartData: fetchDashboardChartData,
  fetchRecentProposals,
  fetchRecentActivity,
  transformToDashboardStats,
};
