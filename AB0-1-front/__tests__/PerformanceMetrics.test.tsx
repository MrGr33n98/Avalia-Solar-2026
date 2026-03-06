import { render, screen, waitFor } from '@testing-library/react';
import PerformanceMetrics from '../app/dashboard/components/PerformanceMetrics';
import * as api from '../lib/api';

jest.mock('../app/dashboard/hooks/useCompanyAnalytics', () => ({
  useCompanyAnalytics: jest.fn(),
}));

const { useCompanyAnalytics } = require('../app/dashboard/hooks/useCompanyAnalytics');

describe('PerformanceMetrics - Real Data Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays real analytics data from API', async () => {
    useCompanyAnalytics.mockReturnValue({
      data: {
        views_30d: 1500,
        cta_clicks_30d: 200,
        whatsapp_clicks_30d: 120,
        leads_30d: 45,
        conversion_rate: 3.0,
        data_source: 'company_daily_stats',
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PerformanceMetrics companyId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/1,500|1.500/)).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton while fetching', () => {
    useCompanyAnalytics.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
    });

    const { container } = render(<PerformanceMetrics companyId="123" />);

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error state gracefully', () => {
    useCompanyAnalytics.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load analytics',
      refresh: jest.fn(),
    });

    render(<PerformanceMetrics companyId="123" />);

    expect(screen.getByText('Erro ao carregar métricas')).toBeInTheDocument();
    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
  });

  it('calculates conversion rate from real data', () => {
    useCompanyAnalytics.mockReturnValue({
      data: {
        views_30d: 1000,
        cta_clicks_30d: 125,
        whatsapp_clicks_30d: 75,
        leads_30d: 30,
        conversion_rate: 12.5,
        data_source: 'company_daily_stats',
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PerformanceMetrics companyId="123" />);

    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });
});
