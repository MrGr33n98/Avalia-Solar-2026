import { renderHook, waitFor } from '@testing-library/react';
import { useCompanyAnalytics } from '../app/dashboard/hooks/useCompanyAnalytics';
import * as api from '../lib/api';

jest.mock('../lib/api', () => ({
  companyDashboardApi: {
    getAnalyticsOverview: jest.fn(),
  },
}));

describe('useCompanyAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches analytics data on mount', async () => {
    const mockData = {
      views_30d: 1234,
      cta_clicks_30d: 156,
      whatsapp_clicks_30d: 89,
      leads_30d: 45,
      conversion_rate: 3.65,
      data_source: 'company_daily_stats',
    };

    (api.companyDashboardApi.getAnalyticsOverview as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useCompanyAnalytics({ companyId: '123' }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(api.companyDashboardApi.getAnalyticsOverview).toHaveBeenCalledWith('123');
  });

  it('handles API errors gracefully', async () => {
    const mockError = new Error('Network error');
    (api.companyDashboardApi.getAnalyticsOverview as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useCompanyAnalytics({ companyId: '123' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('supports manual refresh', async () => {
    const mockData = {
      views_30d: 5000,
      cta_clicks_30d: 200,
      whatsapp_clicks_30d: 100,
      leads_30d: 50,
      conversion_rate: 1.0,
      data_source: 'company_daily_stats',
    };

    (api.companyDashboardApi.getAnalyticsOverview as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useCompanyAnalytics({
        companyId: '123',
        autoRefresh: false,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.companyDashboardApi.getAnalyticsOverview).toHaveBeenCalledTimes(1);

    await result.current.refresh();

    await waitFor(() => {
      expect(api.companyDashboardApi.getAnalyticsOverview).toHaveBeenCalledTimes(2);
    });
  });

  it('auto-refreshes when enabled', async () => {
    jest.useFakeTimers();

    const mockData = {
      views_30d: 100,
      cta_clicks_30d: 10,
      whatsapp_clicks_30d: 5,
      leads_30d: 2,
      conversion_rate: 2.0,
      data_source: 'company_daily_stats',
    };

    (api.companyDashboardApi.getAnalyticsOverview as jest.Mock).mockResolvedValue(mockData);

    renderHook(() =>
      useCompanyAnalytics({
        companyId: '123',
        autoRefresh: true,
        refreshInterval: 30000,
      })
    );

    await waitFor(() => {
      expect(api.companyDashboardApi.getAnalyticsOverview).toHaveBeenCalledTimes(1);
    });

    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(api.companyDashboardApi.getAnalyticsOverview).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});
