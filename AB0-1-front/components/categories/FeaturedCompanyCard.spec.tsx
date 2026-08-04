import { render, screen } from '@testing-library/react';
import FeaturedCompanyCard from '@/components/categories/FeaturedCompanyCard';
import { Company } from '@/lib/api';

jest.mock('@/components/CompanyLogo', () => ({
  CompanyLogo: ({ name }: { name: string }) => <div>{name}</div>,
}));
jest.mock('@/components/ComparisonToggleButton', () => () => null);
jest.mock('@/app/companies/[id]/components/CompanyViewCounter', () => () => null);
jest.mock('@/lib/quote-wizard', () => ({ openQuoteWizard: jest.fn() }));

const buildCompany = (hasPaidPlan: boolean): Company =>
  ({
    id: 1,
    slug: 'empresa-teste',
    name: 'Empresa Teste',
    city: 'Sao Paulo',
    state: 'SP',
    status: 'active',
    verified: true,
    category: 'solar',
    description: '',
    website: '',
    phone: '',
    address: '',
    created_at: '',
    updated_at: '',
    has_paid_plan: hasPaidPlan,
  }) as Company;

describe('FeaturedCompanyCard', () => {
  it('exibe o selo Destaque para a primeira empresa quando ela possui plano pago', () => {
    render(
      <FeaturedCompanyCard company={buildCompany(true)} category="solar" isFirst />
    );

    expect(screen.getByText('Destaque')).toBeInTheDocument();
  });

  it('nao exibe o selo Destaque para empresa sem plano pago', () => {
    render(
      <FeaturedCompanyCard company={buildCompany(false)} category="solar" isFirst />
    );

    expect(screen.queryByText('Destaque')).not.toBeInTheDocument();
  });
});
