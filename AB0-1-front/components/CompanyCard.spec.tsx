import { render, screen } from '@testing-library/react';
import CompanyCard from './CompanyCard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: () => false,
    toggleComparison: jest.fn(),
    canAddMore: true,
  }),
}));

jest.mock('@/lib/lead-engine', () => ({
  openLeadModal: jest.fn(),
  resolveWizardCategoryId: jest.fn(),
}));

jest.mock('@/components/company/ReviewCompanyButton', () => ({
  __esModule: true,
  default: ({ company, label = 'Avaliar', className }: { company: { name?: string }; label?: string; className?: string }) => (
    <a href="#review" aria-label={`${label}: ${company.name}`} className={className}>
      {label}
    </a>
  ),
}));

jest.mock('@/components/quote/QuoteCTA', () => ({
  QuoteCTA: ({ className, shortLabel = 'Orçamento' }: { className?: string; shortLabel?: string }) => (
    <button type="button" className={className} aria-label="Solicitar orçamento">
      {shortLabel}
    </button>
  ),
}));

jest.mock('@/components/icons/AnimatedCompareIcon', () => ({
  AnimatedCompareIcon: ({ size }: { size?: number }) => (
    <span aria-hidden="true" data-testid="compare-icon" data-size={size} />
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt = '', ...props }: { alt?: string }) => <span role="img" aria-label={alt} {...props} />,
}));

const company = {
  id: 1,
  name: 'GoodWe Brasil',
  slug: 'goodwe-brasil',
  city: 'Florianópolis',
  state: 'SC',
  rating_avg: 4.4,
  rating_count: 2,
  has_paid_plan: true,
  coverage_states: ['Todos'],
};

describe('CompanyCard standard actions', () => {
  it('renders compare, review and quote for eligible company', () => {
    render(<CompanyCard company={company} variant="standard" />);

    const compare = screen.getByRole('button', { name: 'Adicionar GoodWe Brasil à comparação' });
    expect(compare).toBeInTheDocument();
    expect(compare).toHaveAttribute('aria-pressed', 'false');
    expect(compare).toHaveClass('bg-white');
    expect(screen.getByRole('link', { name: 'Avaliar: GoodWe Brasil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar orçamento' })).toBeInTheDocument();
  });

  it('hides quote for company without paid plan', () => {
    render(<CompanyCard company={{ ...company, has_paid_plan: false }} variant="standard" />);

    expect(screen.getByRole('button', { name: 'Adicionar GoodWe Brasil à comparação' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Avaliar: GoodWe Brasil' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
  });

  it('uses unified primary action row for compare and review', () => {
    render(<CompanyCard company={company} variant="standard" />);

    const compare = screen.getByRole('button', { name: 'Adicionar GoodWe Brasil à comparação' });
    const review = screen.getByRole('link', { name: 'Avaliar: GoodWe Brasil' });
    const quote = screen.getByRole('button', { name: 'Solicitar orçamento' });

    expect(compare).toHaveClass('w-full');
    expect(review).toHaveClass('w-full', 'bg-blue-600', 'text-white');
    expect(quote).toHaveClass('w-full');
  });

  it('mantém círculo de comparação com tamanho visual adequado', () => {
    render(<CompanyCard company={company} variant="standard" />);

    expect(screen.getByTestId('compare-icon')).toHaveAttribute('data-size', '28');
  });

  it('does not render fabricated criteria or SLA', () => {
    render(<CompanyCard company={{ ...company, has_paid_plan: false }} variant="standard" />);

    expect(screen.queryByText('Equipe qualificada')).not.toBeInTheDocument();
    expect(screen.queryByText('24h')).not.toBeInTheDocument();
  });
});