import { renderHook, waitFor } from '@testing-library/react';
import { useCompanyDashboardData } from '@/app/dashboard/hooks/useCompanyDashboardData';
import { companiesApi, fetchApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  companiesApi: {
    getById: jest.fn(),
    getFeatureAccess: jest.fn(),
  },
  fetchApi: jest.fn(),
}));

jest.mock('@/lib/cable', () => ({
  subscribeCompanyDashboard: jest.fn(() => () => {}),
}));

describe('useCompanyDashboardData (Carregamento Progressivo)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('libera loading=false assim que os dados essenciais da empresa e permissões carregam', async () => {
    (companiesApi.getById as jest.Mock).mockResolvedValue({
      id: 10,
      name: 'Instaladora Solar Top',
      status: 'active',
      plan_tier: 'pro',
    });

    (companiesApi.getFeatureAccess as jest.Mock).mockResolvedValue({
      features: {
        advanced_analytics: { state: 'unlocked' },
      },
    });

    // Simula stats e notifications demorados
    (fetchApi as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === '/company_dashboard/stats') {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                stats: { profile_views: 120, leads_received: 15 },
              }),
            100
          )
        );
      }
      if (endpoint === '/company_dashboard/notifications') {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                notifications: [],
              }),
            150
          )
        );
      }
      return Promise.resolve({});
    });

    const { result } = renderHook(() => useCompanyDashboardData('10'));

    // Imediatamente está loading
    expect(result.current.loading).toBe(true);

    // Assim que os dados essenciais (empresa e feature access) chegam, loading fica false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.company).toBeDefined();
      expect(result.current.company.name).toBe('Instaladora Solar Top');
    });

    // As estatísticas secundárias chegam progressivamente
    await waitFor(() => {
      expect(result.current.statsLoading).toBe(false);
      expect(result.current.stats?.profileViews).toBe(120);
    });
  });

  it('não bloqueia a renderização do dashboard se as notificações falharem', async () => {
    (companiesApi.getById as jest.Mock).mockResolvedValue({
      id: 10,
      name: 'Instaladora Solar Top',
      status: 'active',
    });

    (companiesApi.getFeatureAccess as jest.Mock).mockResolvedValue({
      features: {},
    });

    (fetchApi as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === '/company_dashboard/notifications') {
        return Promise.reject(new Error('Falha de rede em notificações'));
      }
      if (endpoint === '/company_dashboard/stats') {
        return Promise.resolve({ stats: { profile_views: 50 } });
      }
      return Promise.resolve({});
    });

    const { result } = renderHook(() => useCompanyDashboardData('10'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.company).toBeDefined();
    });

    await waitFor(() => {
      expect(result.current.notificationsLoading).toBe(false);
      expect(result.current.notifications).toEqual([]);
      expect(result.current.stats?.profileViews).toBe(50);
    });
  });
});
