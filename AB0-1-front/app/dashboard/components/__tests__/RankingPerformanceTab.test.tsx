import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RankingPerformanceTab from '../RankingPerformanceTab';
import { fetchApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(),
}));

jest.mock('../MagicQuadrant', () => ({
  __esModule: true,
  default: () => <div data-testid="magic-quadrant">Magic Quadrant</div>,
}));

jest.mock('recharts', () => {
  const Mock = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;

  return {
    ResponsiveContainer: Mock,
    LineChart: Mock,
    Line: () => <div data-testid="line-chart-series" />,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    CartesianGrid: () => null,
    Area: () => <div data-testid="area-chart-series" />,
    AreaChart: Mock,
  };
});

describe('RankingPerformanceTab', () => {
  const company = {
    id: 19,
    name: 'WEG Solar',
    slug: 'weg-solar',
    city: 'Blumenau',
    state: 'SC',
    status: 'active',
    verified: true,
    category: 'solar',
    description: 'Empresa teste',
    website: '',
    phone: '',
    address: '',
    created_at: '',
    updated_at: '',
  };

  const stats = {
    leadsReceived: 11,
    ctaClicks: 42,
    profileViews: 120,
  };

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('renders ranking analytics without crashing when themeMode is passed', async () => {
    (fetchApi as jest.Mock).mockResolvedValue({
      rank_position: 2,
      ranking_score: 91.4,
      magic_quadrant_points: [
        {
          name: 'WEG Solar',
          completenessOfVision: 4.7,
          abilityToExecute: 4.5,
          isCurrentCompany: true,
        },
      ],
    });

    render(<RankingPerformanceTab company={company as any} stats={stats} themeMode="light" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Ranking & Performance/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Top 2 na Categoria/i)).toBeInTheDocument();
    expect(screen.getByText('91.4')).toBeInTheDocument();
    expect(screen.getByTestId('magic-quadrant')).toBeInTheDocument();
  });

  it('falls back to dark theme safely when themeMode is omitted', async () => {
    (fetchApi as jest.Mock).mockResolvedValue({
      rank_position: 1,
      ranking_score: 99.1,
      magic_quadrant_points: [],
    });

    render(<RankingPerformanceTab company={company as any} stats={stats} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Top 1 na Categoria/i)).toBeInTheDocument();
    });
  });
});
