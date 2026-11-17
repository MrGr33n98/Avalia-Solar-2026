import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Company } from '@/lib/api';
import { canUsePaidConversion } from '@/lib/feature-access';
import { openLeadModal } from '@/lib/lead-engine';
import RelatedCompaniesTable from './RelatedCompaniesTable';

jest.mock('@/components/CompanyLogo', () => ({
  CompanyLogo: ({ name }: { name: string }) => <span role="img" aria-label={`Logo de ${name}`} />,
}));

jest.mock('@/components/company/CompanyVerifiedBadge', () => ({
  CompanyVerifiedBadge: () => <span data-testid="related-verified" aria-label="Empresa verificada" />,
}));

jest.mock('@/components/ComparisonToggleButton', () => ({
  __esModule: true,
  default: ({ company }: { company: Company }) => (
    <label>
      <input type="checkbox" aria-label={`Adicionar ${company.name} à comparação`} />
      Comparar
    </label>
  ),
}));

jest.mock('@/components/quote/QuoteCTA', () => ({
  QuoteCTA: ({ onRequest, className }: { onRequest: () => void; className?: string }) => (
    <button type="button" onClick={onRequest} className={className} aria-label="Solicitar orçamento">
      Orçamento
    </button>
  ),
}));

jest.mock('@/lib/feature-access', () => ({ canUsePaidConversion: jest.fn() }));
jest.mock('@/lib/lead-engine', () => ({ openLeadModal: jest.fn() }));

// Select mockado em elemento nativo para testar contrato de paginação sem geometria de portal.
jest.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      aria-label="Quantidade de empresas por página"
      value={value}
      onChange={(event) => onValueChange(event.currentTarget.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}));

const companies = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: index === 0 ? 'GoodWe Brasil' : `Empresa ${index + 1}`,
  slug: `empresa-${index + 1}`,
  city: 'Florianópolis',
  state: 'SC',
  verified: index === 0,
  rating_count: 0,
  rating_avg: 0,
} as unknown as Company));

describe('Empresas relacionadas — grid compacto PWA e Web', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (canUsePaidConversion as jest.Mock).mockReturnValue(false);
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renderiza um grid único com cabeçalho e comparação alinhada', () => {
    render(<RelatedCompaniesTable companies={companies.slice(0, 2)} />);

    const section = screen.getByTestId('related-companies-section');
    const grid = screen.getByTestId('related-companies-grid');
    const rows = within(grid).getAllByRole('listitem');

    expect(section).toHaveClass('min-w-0');
    expect(grid).toHaveClass('divide-y', 'rounded-xl');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveClass('min-h-[76px]', 'grid-cols-[40px_minmax(0,1fr)_100px]');
    expect(within(rows[0]).getByRole('link', { name: 'GoodWe Brasil' })).toHaveAttribute(
      'href',
      '/companies/empresa-1'
    );
    expect(within(rows[0]).getByText('Florianópolis, SC')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Sem avaliações')).toBeInTheDocument();
    expect(within(rows[0]).getByTestId('related-verified')).toBeInTheDocument();
    expect(within(grid).queryByText(/^#\d+$/)).not.toBeInTheDocument();
    expect(within(rows[0]).getByRole('checkbox', { name: /Adicionar GoodWe Brasil/ })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Empresas relacionadas/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Quantidade de empresas por página' })).toHaveValue('10');
  });


  it('mantém o selo imediatamente após o nome, com alinhamento estável no PWA e na web', () => {
    render(<RelatedCompaniesTable companies={companies.slice(0, 2)} />);

    const verifiedRow = screen.getAllByTestId('related-company-row')[0];
    const identity = within(verifiedRow).getByTestId('related-company-identity');
    const name = within(identity).getByRole('link', { name: 'GoodWe Brasil' });
    const badge = within(identity).getByTestId('related-verified');

    expect(identity).toHaveClass('inline-flex', 'w-fit', 'max-w-full', 'min-w-0', 'items-center', 'gap-1');
    expect(name).toHaveClass('min-w-0', 'truncate');
    expect(name).toHaveAttribute('title', 'GoodWe Brasil');
    expect(name.nextElementSibling).toBe(badge);
    expect(within(screen.getAllByTestId('related-company-row')[1]).queryByTestId('related-verified')).not.toBeInTheDocument();
  });

  it('preserva o nome completo acessível e mantém o selo na mesma unidade com nomes extensos', () => {
    const longName = 'Cooperativa de Soluções Sustentáveis em Energia Fotovoltaica e Mobilidade Elétrica';
    render(
      <RelatedCompaniesTable
        companies={[{ ...companies[0], name: longName, verified: true }]}
      />
    );

    const identity = screen.getByTestId('related-company-identity');
    const name = within(identity).getByRole('link', { name: longName });
    const badge = within(identity).getByTestId('related-verified');

    expect(name).toHaveTextContent(longName);
    expect(name).toHaveAttribute('title', longName);
    expect(name).toHaveClass('truncate', 'min-w-0');
    expect(identity).toHaveClass('max-w-full', 'items-center');
    expect(name.nextElementSibling).toBe(badge);
  });

  it('preserva paginação e mudança entre 5, 10 e 20 empresas', () => {
    render(<RelatedCompaniesTable companies={companies} />);

    expect(screen.getAllByTestId('related-company-row')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(screen.getAllByTestId('related-company-row')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Empresa 12' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');

    fireEvent.change(screen.getByRole('combobox', { name: 'Quantidade de empresas por página' }), {
      target: { value: '5' },
    });
    expect(screen.getAllByTestId('related-company-row')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '20' } });
    expect(screen.getAllByTestId('related-company-row')).toHaveLength(12);
    expect(screen.queryByRole('button', { name: 'Próxima página' })).not.toBeInTheDocument();
  });

  it('mantém o orçamento condicionado à permissão comercial e a origem do lead', () => {
    (canUsePaidConversion as jest.Mock).mockImplementation((company) => company.id === 1);
    render(<RelatedCompaniesTable companies={companies.slice(0, 2)} />);

    const first = screen.getAllByTestId('related-company-row')[0];
    const second = screen.getAllByTestId('related-company-row')[1];

    expect(within(first).getAllByRole('button', { name: 'Solicitar orçamento' })).toHaveLength(2);
    expect(within(second).queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();

    fireEvent.click(within(first).getAllByRole('button', { name: 'Solicitar orçamento' })[0]);
    expect(openLeadModal).toHaveBeenCalledTimes(1);
    expect(openLeadModal).toHaveBeenCalledWith({
      preferredCompanyId: 1,
      source: 'category-table',
      type: 'quick',
    });
    expect(canUsePaidConversion).toHaveBeenCalledWith(companies[0], 'quote');
  });

  it('não fabrica avaliações ou empresas quando a lista está vazia', () => {
    const { container } = render(<RelatedCompaniesTable companies={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
