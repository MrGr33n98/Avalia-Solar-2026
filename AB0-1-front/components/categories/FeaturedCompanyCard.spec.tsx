import { render, screen } from '@testing-library/react';
import FeaturedCompanyCard from '@/components/categories/FeaturedCompanyCard';
import { Company } from '@/lib/api';

const mockIsInComparison = jest.fn().mockReturnValue(false);
const mockAddToComparison = jest.fn();

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: mockIsInComparison,
    addToComparison: mockAddToComparison,
    removeFromComparison: jest.fn(),
    canAddMore: true,
    count: 0,
    maxComparison: 4,
    getCompanyPosition: () => null,
  }),
}));
jest.mock('@/components/CompanyLogo', () => ({
  CompanyLogo: ({ name }: { name: string }) => <div>{name}</div>,
}));
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
    feature_access: hasPaidPlan ? { custom_ctas: { state: 'enabled', value: true } } : {},
  }) as Company;

describe('FeaturedCompanyCard', () => {
  it('nao exibe a faixa automatica Destaque para empresa com plano pago e exibe CTA de orcamento', () => {
    render(<FeaturedCompanyCard company={buildCompany(true)} category="solar" isFirst />);

    expect(screen.queryByText('Destaque')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar orçamento' })).toBeInTheDocument();
  });

  it('nao exibe a faixa Destaque nem CTA de orcamento para empresa sem plano pago', () => {
    render(<FeaturedCompanyCard company={buildCompany(false)} category="solar" isFirst />);

    expect(screen.queryByText('Destaque')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
  });

  it('renderiza selo de verificacao e botao de comparacao simultaneamente em regioes proprias', () => {
    render(<FeaturedCompanyCard company={buildCompany(true)} category="solar" isFirst />);

    expect(screen.getByLabelText(/Perfil Verificado|Empresa verificada/i)).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Adicionar Empresa Teste à comparação' })
    ).toBeInTheDocument();
  });
});
