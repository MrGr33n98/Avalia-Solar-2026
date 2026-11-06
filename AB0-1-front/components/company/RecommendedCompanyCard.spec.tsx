import { fireEvent, render, screen } from '@testing-library/react';
import RecommendedCompanyCard from './RecommendedCompanyCard';

jest.mock('@/components/ComparisonToggleButton', () => ({
  __esModule: true,
  default: () => <span>Comparar</span>,
}));
jest.mock('@/components/CompanyLogo', () => ({
  CompanyLogo: () => <span>Logo</span>,
}));
jest.mock('@/components/company/CompanyIdentityLine', () => ({
  CompanyIdentityLine: ({ name }: { name: string }) => <span>{name}</span>,
}));
jest.mock('@/lib/analytics/recommendations', () => ({
  trackRecommendedCompanyImpression: jest.fn(),
  trackRecommendedPrimaryCtaClicked: jest.fn(),
}));
const openQuoteWizard = jest.fn();
jest.mock('@/lib/quote-wizard', () => ({
  openQuoteWizard: (...args: unknown[]) => openQuoteWizard(...args),
}));
const company = {
  id: 42,
  name: 'Solar de teste',
  slug: 'solar-de-teste',
  segment: 'installer',
  sponsored: true,
  primary_cta: {
    type: 'request_quote',
    action: 'open_quote_wizard',
    label: 'Solicitar orçamento',
    url: '/companies/solar-de-teste',
    preferred_company_id: 42,
  },
};

describe('RecommendedCompanyCard — entitlement contract', () => {
  beforeEach(() => openQuoteWizard.mockClear());

  it('fails closed for Free even if an old/stale API asks for quote', () => {
    render(<RecommendedCompanyCard company={{ ...company, has_paid_plan: false } as any} />);
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Ver perfil/i }).some((link) => link.getAttribute('href') === '/companies/solar-de-teste')).toBe(true);
  });

  it('opens a company-scoped wizard for explicitly entitled paid company', () => {
    render(<RecommendedCompanyCard company={{
      ...company, has_paid_plan: true,
      cta_visibility: { effective: { quote: true, whatsapp: false } },
    } as any} />);
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar orçamento' }));
    expect(openQuoteWizard).toHaveBeenCalledWith({
      preferredCompanyId: 42, source: 'home-recommendations',
    });
  });

  it('does not grant quote when paid plan exists but effective entitlement is missing', () => {
    render(<RecommendedCompanyCard company={{ ...company, has_paid_plan: true } as any} />);
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
  });
});
