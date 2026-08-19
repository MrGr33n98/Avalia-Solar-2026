import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecommendedCompaniesSection from '@/components/home/RecommendedCompaniesSection';
import { publicCompaniesApi } from '@/lib/api-public';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock useComparison hook
jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: jest.fn(() => false),
    addToComparison: jest.fn(),
    removeFromComparison: jest.fn(),
    getCompanyPosition: jest.fn(),
    canAddMore: true,
    count: 0,
  }),
}));

// Mock publicCompaniesApi
jest.mock('@/lib/api-public', () => ({
  ...jest.requireActual('@/lib/api-public'),
  publicCompaniesApi: {
    getRecommendations: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: (props: any) => <svg data-testid="star-icon" className={props.className} />,
  BadgeCheck: (props: any) => <svg data-testid="badge-check-icon" className={props.className} />,
  Briefcase: (props: any) => <svg data-testid="briefcase-icon" className={props.className} />,
  Clock: (props: any) => <svg data-testid="clock-icon" className={props.className} />,
  MapPin: (props: any) => <svg data-testid="map-pin-icon" className={props.className} />,
  ArrowRight: (props: any) => <svg data-testid="arrow-right-icon" className={props.className} />,
  Sparkles: (props: any) => <svg data-testid="sparkles-icon" className={props.className} />,
  AlertCircle: (props: any) => <svg data-testid="alert-circle-icon" className={props.className} />,
  RefreshCw: (props: any) => <svg data-testid="refresh-cw-icon" className={props.className} />,
  Megaphone: (props: any) => <svg data-testid="megaphone-icon" className={props.className} />,
  Plus: (props: any) => <svg data-testid="plus-icon" className={props.className} />,
  Check: (props: any) => <svg data-testid="check-icon" className={props.className} />,
  Crown: (props: any) => <svg data-testid="crown-icon" className={props.className} />,
}));

beforeAll(() => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

describe('RecommendedCompaniesSection', () => {
  const mockRecommendations = {
    meta: {
      request_id: 'req_123',
      location: {
        city: 'Florianópolis',
        state: 'SC',
        source: 'explicit_param',
      },
    },
    data: [
      {
        id: 1,
        name: 'Empresa Teste Recomendada',
        slug: 'empresa-teste-recomendada',
        segment: 'installer',
        verified: true,
        sponsored: true,
        recommendation_reason: {
          code: 'LOCAL_COVERAGE',
          label: 'Sede em Florianópolis, SC',
        },
        rating: {
          average: 4.9,
          count: 42,
          label: '4,9 (42 avaliações)',
        },
        response_time: {
          value: '2h',
          label: 'Responde em até 2h',
        },
        projects: {
          count: 85,
          label: '85 projetos verificados',
        },
        primary_cta: {
          type: 'request_quote',
          label: 'Solicitar orçamento',
          action: 'open_quote_form',
          url: '/empresas/empresa-teste-recomendada',
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (publicCompaniesApi.getRecommendations as jest.Mock).mockImplementation(() =>
      Promise.resolve(mockRecommendations)
    );
  });

  it('renders section title and tab filters', async () => {
    render(<RecommendedCompaniesSection />);

    expect(
      screen.getByRole('heading', { name: /Empresas recomendadas para você/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Todas' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Empresa Teste Recomendada')).toBeInTheDocument();
    });
    expect(screen.getByText('Solicitar orçamento')).toBeInTheDocument();
    expect(screen.getByText('Patrocinado')).toBeInTheDocument();
  });

  it('fetches new segment recommendations when clicking tabs', async () => {
    render(<RecommendedCompaniesSection />);

    await waitFor(() => {
      expect(screen.getByText('Empresa Teste Recomendada')).toBeInTheDocument();
    });

    const installerTab = screen.getByRole('tab', { name: 'Instaladores' });
    fireEvent.click(installerTab);

    await waitFor(() => {
      expect(publicCompaniesApi.getRecommendations).toHaveBeenCalledWith({
        segment: 'installer',
        limit: 8,
      });
    });
  });
});
