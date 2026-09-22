import { render, screen } from '@testing-library/react';
import RankingPerformanceTab from './RankingPerformanceTab';

let mockRankingData: Record<string, unknown>;
let mockRankingError: unknown = null;

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'company-analytics-ranking') {
      return {
        data: mockRankingData,
        isLoading: false,
        isError: Boolean(mockRankingError),
        error: mockRankingError,
        isPlaceholderData: Boolean(mockRankingError),
        refetch: jest.fn(),
      };
    }
    if (queryKey[0] === 'company-analytics-ranking-filter-options') {
      return {
        data: {
          categories: [],
          states: ['SP'],
          sectors: ['Residenciais'],
          cities: [],
          selected_state: null,
        },
        isLoading: false,
      };
    }
    return { data: { criteria: [] }, isLoading: false };
  },
}));

jest.mock('./MetricCard', () => ({
  __esModule: true,
  default: ({ title, value, change }: { title: string; value: string; change: string }) => (
    <div data-testid={`metric-${title}`}>{`${title}: ${value} ${change}`}</div>
  ),
}));
jest.mock('./MagicQuadrant', () => ({
  __esModule: true,
  default: () => <div data-testid="quadrant" />,
}));
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Area: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  SelectValue: () => null,
}));
jest.mock('@/components/ui/skeleton', () => ({ Skeleton: () => <div /> }));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

describe('RankingPerformanceTab', () => {
  beforeEach(() => {
    mockRankingError = null;
    mockRankingData = {
      status: 'ready',
      mode: 'canonical',
      ranking: { status: 'ready', position: 4, population: 50, score: 42.4, percentile: 94.0 },
      definition: {
        definition_version: 'organic-performance-v2',
        purpose: 'organic_performance',
        sponsored_included: false,
        quality_flags: [],
      },
      history: { status: 'ready', items: [], trend_30d: null },
      quadrant: { status: 'ready', preview: false, points: [], meta: {} },
      insights: { strengths: [], opportunities: [], next_best_action: null },
    };
  });

  it('uses V2 fields and formats score as points rather than a percentile', () => {
    render(
      <RankingPerformanceTab
        company={{ id: 1, name: 'Empresa Solar', categories: [] } as never}
        stats={{ conversionRate: 12.5 }}
      />
    );

    expect(screen.getByTestId('metric-Sua posição')).toHaveTextContent('4º de 50');
    expect(screen.getByTestId('metric-Percentil de mercado')).toHaveTextContent('94.0%');
    expect(screen.getByTestId('metric-Pontuação orgânica')).toHaveTextContent('42.4 pts');
    expect(screen.getByTestId('metric-Pontuação orgânica')).not.toHaveTextContent('42.4%');
  });

  it('communicates a processing snapshot as a business state', () => {
    mockRankingData = {
      ...mockRankingData,
      status: 'processing',
      ranking: {
        status: 'processing',
        position: null,
        population: null,
        score: null,
        percentile: null,
      },
    };

    render(
      <RankingPerformanceTab company={{ id: 1, name: 'Empresa Solar', categories: [] } as never} />
    );

    expect(screen.getByText('Ranking em processamento')).toBeInTheDocument();
  });

  it('identifica dados anteriores e preserva o erro estruturado sem object coercion', () => {
    mockRankingError = {
      message: '[500] Ranking indisponível',
      status: 500,
      code: 'RANKING_UNAVAILABLE',
      requestId: 'req-372',
    };
    mockRankingData = {
      ...mockRankingData,
      quality: { flags: [], computed_at: '2026-09-22T10:00:00Z' },
    };

    render(<RankingPerformanceTab company={{ id: 1, name: 'Empresa Solar', categories: [] } as never} />);

    expect(screen.getByText('Ranking indisponível')).toBeInTheDocument();
    expect(screen.getAllByText(/último estado conhecido/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/RANKING_UNAVAILABLE/)).toBeInTheDocument();
    expect(screen.getByText(/request_id: req-372/)).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });
});
