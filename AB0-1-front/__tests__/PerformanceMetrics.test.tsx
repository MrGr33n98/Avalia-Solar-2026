import { render, screen, waitFor } from '../tests/test-utils';
import PerformanceMetrics from '../app/dashboard/components/PerformanceMetrics';
import * as api from '../lib/api';

// Mock the API calls
jest.mock('../lib/api', () => ({
  request: jest.fn(),
}));

jest.mock('../app/dashboard/hooks/useCompanyAnalytics', () => ({
  useCompanyAnalytics: jest.fn(),
}));

const { useCompanyAnalytics } = require('../app/dashboard/hooks/useCompanyAnalytics');
const mockRequest = api.request as jest.MockedFunction<typeof api.request>;

describe('PerformanceMetrics - Real Data Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API calls
    mockRequest.mockResolvedValue({
      data: [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 150 },
      ],
    });
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

    expect(screen.getByText(/Não foi possível carregar os dados de analytics/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load analytics/)).toBeInTheDocument();
  });

  it('does not display a trend when comparison data is unavailable', () => {
    useCompanyAnalytics.mockReturnValue({
      data: { views_30d: 0, cta_clicks_30d: 0, views_trend: null, cta_clicks_trend: null },
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PerformanceMetrics companyId="123" />);

    expect(screen.queryByText(/Ratio/)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
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
