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
      return { data: mockRankingData, isLoading: false, isError: Boolean(mockRankingError), error: mockRankingError, isPlaceholderData: Boolean(mockRankingError), refetch: jest.fn() };
    }
    if (queryKey[0] === 'company-analytics-ranking-filter-options') {
      return { data: { categories: [], states: ['SC'], sectors: ['Residenciais'], cities: [], selected_state: null }, isLoading: false };
    }
    return { data: { criteria: [] }, isLoading: false };
  },
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null,
  Area: () => null, AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  SelectValue: () => null,
}));
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/skeleton', () => ({ Skeleton: () => <div /> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button> }));
jest.mock('./MagicQuadrant', () => ({ __esModule: true, default: () => <div data-testid="quadrant" /> }));

const company = { id: 1, name: 'Empresa Solar', categories: [] } as never;

describe('RankingPerformanceTab', () => {
  beforeEach(() => {
    mockRankingError = null;
    mockRankingData = {
      status: 'ready',
      mode: 'canonical',
      official_scope: { type: 'global', category_id: null },
      comparison_scope: { active: false, state: null, city: null, sector: null, category_id: null, criterion_slug: null },
      ranking: { status: 'ready', position: 4, population: 50, score: 42.4, percentile: 94.0, population_label: 'eligible_companies' },
      official_ranking: { status: 'ready', position: 4, population: 50, score: 42.4, percentile: 94.0, population_label: 'eligible_companies' },
      benchmarks: { status: 'ready', population: 50, median_score: 31, p75_score: 41, p90_score: 55 },
      definition: { definition_version: 'organic-performance-v2', purpose: 'organic_performance', sponsored_included: false, quality_flags: [], data_through: '2026-09-21T23:59:59Z' },
      quality: { flags: [] },
      history: { status: 'ready', scope: 'official', items: [], trend_30d: null },
      quadrant: { status: 'ready', preview: false, points: [], meta: {} },
      insights: { strengths: [], opportunities: [], next_best_action: null },
    };
  });

  it('renders the official position and real score as points', () => {
    render(<RankingPerformanceTab company={company} stats={{ conversionRate: 12.5 }} />);

    expect(screen.getByText('Ranking oficial')).toBeInTheDocument();
    expect(screen.getByText('4º de 50')).toBeInTheDocument();
    expect(screen.getByText('42.4 pts')).toBeInTheDocument();
    expect(screen.queryByText('42.4%')).not.toBeInTheDocument();
  });

  it('separates the SC comparison from the official ranking', () => {
    mockRankingData = {
      ...mockRankingData,
      status: 'preview',
      mode: 'preview',
      comparison_scope: { active: true, state: 'SC', city: null, sector: null, category_id: null, criterion_slug: null },
      ranking: { status: 'preview', position: 8, population: 41, score: 42.4, percentile: 82.9, population_label: 'eligible_companies' },
      official_ranking: { status: 'ready', position: 32, population: 458, score: 42.4, percentile: 93.2, population_label: 'eligible_companies' },
    };

    render(<RankingPerformanceTab company={company} />);

    expect(screen.getByText('Desempenho em Santa Catarina')).toBeInTheDocument();
    expect(screen.getByText('Ranking oficial')).toBeInTheDocument();
    expect(screen.getByText('Comparação atual')).toBeInTheDocument();
    expect(screen.getByText('32º de 458')).toBeInTheDocument();
    expect(screen.getByText('8º de 41')).toBeInTheDocument();
  });

  it('translates quality flags instead of exposing their raw codes', () => {
    mockRankingData = { ...mockRankingData, quality: { flags: ['snapshot_stale'] } };

    render(<RankingPerformanceTab company={company} />);

    expect(screen.getByText('Atualização pendente')).toBeInTheDocument();
    expect(screen.queryByText('snapshot_stale')).not.toBeInTheDocument();
  });

  it('shows structured errors without object coercion', () => {
    mockRankingError = { message: '[500] Ranking indisponível', status: 500, code: 'RANKING_UNAVAILABLE', requestId: 'req-372' };

    render(<RankingPerformanceTab company={company} />);

    expect(screen.getByText('Ranking indisponível')).toBeInTheDocument();
    expect(screen.getByText(/RANKING_UNAVAILABLE/)).toBeInTheDocument();
    expect(screen.getByText(/request_id: req-372/)).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });
});
