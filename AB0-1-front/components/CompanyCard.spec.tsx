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
  default: ({ company, label = 'Avaliar' }: { company: { name?: string }; label?: string }) => (
    <a href="#review" aria-label={`${label}: ${company.name}`}>
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
  AnimatedCompareIcon: () => <span aria-hidden="true" />,
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

    expect(screen.getByRole('button', { name: 'Comparar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Avaliar: GoodWe Brasil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar orçamento' })).toBeInTheDocument();
  });

  it('hides quote for company without paid plan', () => {
    render(<CompanyCard company={{ ...company, has_paid_plan: false }} variant="standard" />);

    expect(screen.getByRole('button', { name: 'Comparar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Avaliar: GoodWe Brasil' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
  });

  it('uses mobile two-row grid contract for quote action', () => {
    render(<CompanyCard company={company} variant="standard" />);

    const card = screen.getByTestId('company-card');
    const compare = screen.getByRole('button', { name: 'Comparar' });
    const quote = screen.getByRole('button', { name: 'Solicitar orçamento' });

    expect(card.querySelector('.grid-cols-2')).toBeInTheDocument();
    expect(compare).toHaveClass('min-w-0', 'w-full');
    expect(quote).toHaveClass('col-span-2', 'w-full');
  });

  it('does not render fabricated criteria or SLA', () => {
    render(<CompanyCard company={{ ...company, has_paid_plan: false }} variant="standard" />);

    expect(screen.queryByText('Equipe qualificada')).not.toBeInTheDocument();
    expect(screen.queryByText('24h')).not.toBeInTheDocument();
  });
});