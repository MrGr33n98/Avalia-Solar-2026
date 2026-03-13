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
      throw toApiError(response, await response.text());
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Dashboard stats error:', error);
    throw error instanceof ApiError ? error : toApiError(null, String(error));
  }
}

/**
 * Transform backend stats to dashboard format with mock changes
 * In production, backend should provide previous period data for real calculations
 */
export function transformToDashboardStats(
  stats: DashboardStats,
  previousStats?: DashboardStats
): DashboardStatsWithChanges {
  // Calculate changes (mock if no previous data)
  const calculateChange = (current: number, previous?: number): number => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    total_companies: {
      value: stats.companies_count,
      change: previousStats 
        ? calculateChange(stats.companies_count, previousStats.companies_count)
        : 12.5, // Mock
      label: 'vs mês anterior',
    },
    active_proposals: {
      value: stats.leads_count,
      change: previousStats
        ? calculateChange(stats.leads_count, previousStats.leads_count)
        : 8.2, // Mock
      label: 'vs mês anterior',
    },
    conversion_rate: {
      value: stats.leads_count > 0 
        ? (stats.reviews_count / stats.leads_count) * 100 
        : 0,
      change: 4.3, // Mock - needs backend calculation
      label: 'vs mês anterior',
    },
    total_revenue: {
      value: stats.monthly_revenue,
      change: 15.7, // Mock - needs backend calculation
      label: 'vs mês anterior',
    },
  };
}

/**
 * Fetch chart data for dashboard graphs
 * TODO: Backend needs to implement this endpoint
 */
export async function fetchDashboardChartData(
  metric: 'companies' | 'revenue' | 'leads',
  period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
): Promise<ChartDataPoint[]> {
  try {
    const url = buildApiUrl(`/api/v1/dashboard/charts/${metric}`, { period });
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiRequestHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      // If endpoint doesn't exist yet, return mock data
      if (response.status === 404) {
        console.warn('[API] Chart endpoint not implemented, using mock data');
        return generateMockChartData(metric);
      }
      throw toApiError(response, await response.text());
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Dashboard chart data error:', error);
    // Fallback to mock data if API fails
    return generateMockChartData(metric);
  }
}

/**
 * Fetch recent proposals for dashboard table
 * TODO: Backend needs to implement this endpoint or use existing leads endpoint
 */
export async function fetchRecentProposals(
  limit: number = 10
): Promise<RecentProposal[]> {
  try {
    const url = buildApiUrl('/api/v1/leads', { 
      limit,
      sort: 'created_at',
      order: 'desc'
    });
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiRequestHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw toApiError(response, await response.text());
    }

    const data = await response.json();
    return transformLeadsToProposals(data.leads || data);
  } catch (error) {
    console.error('[API] Recent proposals error:', error);
    // Return mock data if API fails
    return generateMockProposals();
  }
}

/**
 * Fetch recent activity feed
 * TODO: Backend needs to implement activity feed endpoint
 */
export async function fetchRecentActivity(
  limit: number = 10
): Promise<RecentActivityItem[]> {
  try {
    const url = buildApiUrl('/api/v1/dashboard/activity', { limit });
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiRequestHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      // If endpoint doesn't exist, return mock data
      if (response.status === 404) {
        console.warn('[API] Activity endpoint not implemented, using mock data');
        return generateMockActivity();
      }
      throw toApiError(response, await response.text());
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Recent activity error:', error);
    return generateMockActivity();
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
// Mock Data Generators (for development)
// ============================================

function generateMockChartData(metric: string): ChartDataPoint[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const baseValues: Record<string, number> = {
    companies: 4000,
    revenue: 400000,
    leads: 150,
  };

  return months.map((month, index) => ({
    month,
    value: baseValues[metric] + Math.random() * 2000 - 1000 + index * 300,
  }));
}

function generateMockProposals(): RecentProposal[] {
  return [
    {
      id: '1',
      company: 'Empresa Solar ABC',
      status: 'Pendente',
      value: 'R$ 45.000',
      date: '15/03/2024',
    },
    {
      id: '2',
      company: 'Energia Verde Ltda',
      status: 'Aprovado',
      value: 'R$ 78.500',
      date: '14/03/2024',
    },
    {
      id: '3',
      company: 'SolarTech Solutions',
      status: 'Em Análise',
      value: 'R$ 125.000',
      date: '13/03/2024',
    },
    {
      id: '4',
      company: 'Green Power Corp',
      status: 'Pendente',
      value: 'R$ 92.300',
      date: '12/03/2024',
    },
  ];
}

function generateMockActivity(): RecentActivityItem[] {
  return [
    {
      id: '1',
      type: 'company',
      title: 'Nova empresa cadastrada',
      description: 'Solar Energy Brasil foi adicionada ao sistema',
      time: 'há 2 horas',
      user: {
        name: 'Sistema',
      },
    },
    {
      id: '2',
      type: 'proposal',
      title: 'Proposta aprovada',
      description: 'Proposta #1234 foi aprovada por João Silva',
      time: 'há 5 horas',
      user: {
        name: 'João Silva',
      },
    },
    {
      id: '3',
      type: 'review',
      title: 'Nova avaliação',
      description: 'Empresa XYZ recebeu 5 estrelas',
      time: 'há 1 dia',
    },
    {
      id: '4',
      type: 'user',
      title: 'Novo usuário',
      description: 'Maria Santos se cadastrou na plataforma',
      time: 'há 2 dias',
      user: {
        name: 'Maria Santos',
      },
    },
  ];
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
