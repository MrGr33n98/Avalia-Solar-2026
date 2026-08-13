import { render, screen } from '@testing-library/react';
import CategoryCompaniesTable from './CategoryCompaniesTable';

jest.mock('@/components/CompanyLogo', () => ({ CompanyLogo: () => <div /> }));
jest.mock(
  '@/components/ComparisonToggleButton',
  () =>
    ({ company }: { company: { id: number } }) => (
      <button data-testid={`compare-${company.id}`}>Compare</button>
    )
);
jest.mock('@/lib/feature-access', () => ({
  hasPaidPlan: (company: { has_paid_plan?: boolean }) => Boolean(company.has_paid_plan),
}));
jest.mock('@/lib/lead-engine', () => ({ openLeadModal: jest.fn() }));

const company = (id: number, paid: boolean) =>
  ({
    id,
    name: `Empresa ${id}`,
    slug: `empresa-${id}`,
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    description: '',
    website: '',
    phone: '',
    address: '',
    created_at: '',
    updated_at: '',
    has_paid_plan: paid,
  }) as any;

describe('CategoryCompaniesTable ações', () => {
  it('reserva slot comercial e mantém Compare alinhado para capabilities mistas', () => {
    render(<CategoryCompaniesTable companies={[company(1, true), company(2, false)]} />);

    expect(screen.getAllByTestId(/compare-/)).toHaveLength(4);
    expect(screen.getAllByText('Solicitar orçamento')).toHaveLength(2);
    expect(screen.getByText('Projetos')).toBeInTheDocument();
  });
});
