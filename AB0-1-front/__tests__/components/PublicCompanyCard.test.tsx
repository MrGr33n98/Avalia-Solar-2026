import { render, screen } from '@testing-library/react';
import PublicCompanyCard from '@/components/company/PublicCompanyCard';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock hooks
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

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: (props: any) => <svg data-testid="star-icon" className={props.className} />,
  BadgeCheck: (props: any) => <svg data-testid="badge-check-icon" className={props.className} />,
  Briefcase: (props: any) => <svg data-testid="briefcase-icon" className={props.className} />,
  Clock: (props: any) => <svg data-testid="clock-icon" className={props.className} />,
  MapPin: (props: any) => <svg data-testid="map-pin-icon" className={props.className} />,
  Scale: (props: any) => <svg data-testid="scale-icon" className={props.className} />,
  Plus: (props: any) => <svg data-testid="plus-icon" className={props.className} />,
  Check: (props: any) => <svg data-testid="check-icon" className={props.className} />,
  Crown: (props: any) => <svg data-testid="crown-icon" className={props.className} />,
}));

describe('PublicCompanyCard - Fallbacks & Honest Metrics', () => {
  it('renders "Sem avaliações" when company has no rating', () => {
    const company = {
      id: 1,
      name: 'Empresa Teste Sem Rating',
      slug: 'empresa-teste-sem-rating',
      rating_avg: 0,
      rating_count: 0,
    };

    render(<PublicCompanyCard company={company} />);

    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
    expect(screen.queryByText('4,5')).not.toBeInTheDocument();
  });

  it('renders real rating and review count when available', () => {
    const company = {
      id: 2,
      name: 'Empresa Teste Com Rating',
      slug: 'empresa-teste-com-rating',
      rating_avg: 4.8,
      rating_count: 35,
    };

    render(<PublicCompanyCard company={company} />);

    expect(screen.getByText('4,8')).toBeInTheDocument();
    expect(screen.getByText('Avaliação (35)')).toBeInTheDocument();
  });

  it('renders "Tempo de resposta não informado" when SLA is missing', () => {
    const company = {
      id: 3,
      name: 'Empresa Sem SLA',
      slug: 'empresa-sem-sla',
    };

    render(<PublicCompanyCard company={company} />);

    expect(screen.getByText('Tempo de resposta não informado')).toBeInTheDocument();
    expect(screen.queryByText('24h')).not.toBeInTheDocument();
  });

  it('renders actual SLA string when available', () => {
    const company = {
      id: 4,
      name: 'Empresa Com SLA',
      slug: 'empresa-com-sla',
      response_time_sla: '2h',
    };

    render(<PublicCompanyCard company={company} />);

    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('renders "Não informado" when projects count is missing', () => {
    const company = {
      id: 5,
      name: 'Empresa Sem Projetos',
      slug: 'empresa-sem-projetos',
    };

    render(<PublicCompanyCard company={company} />);

    expect(screen.getByText('Não informado')).toBeInTheDocument();
    expect(screen.queryByText('Consultar')).not.toBeInTheDocument();
  });

  it('renders "Comparar" button without "Premium" suffix', () => {
    const company = {
      id: 6,
      name: 'Empresa Destaque',
      slug: 'empresa-destaque',
      featured: true,
    };

    render(<PublicCompanyCard company={company} />);

    expect(screen.getByText('Comparar')).toBeInTheDocument();
    expect(screen.queryByText('Comparar Premium')).not.toBeInTheDocument();
  });
});
