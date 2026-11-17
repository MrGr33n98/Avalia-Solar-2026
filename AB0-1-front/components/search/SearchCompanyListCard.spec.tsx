import { fireEvent, render, screen } from '@testing-library/react';
import type { Company } from '@/lib/api';
import { canUsePaidConversion } from '@/lib/feature-access';
import { openLeadModal } from '@/lib/lead-engine';
import { SearchCompanyListCard } from './SearchCompanyListCard';

jest.mock('@/components/CompanyLogo', () => ({
  CompanyLogo: ({ name }: { name: string }) => <div role="img" aria-label={`Logo de ${name}`} />,
}));
jest.mock('@/components/ComparisonToggleButton', () => ({
  __esModule: true,
  default: () => <button type="button" aria-label="Comparar empresa">Comparar</button>,
}));
jest.mock('@/components/quote/QuoteCTA', () => ({
  QuoteCTA: ({ shortLabel, onRequest }: { shortLabel: string; onRequest: () => void }) => (
    <button type="button" onClick={onRequest}>{shortLabel}</button>
  ),
}));
jest.mock('@/lib/feature-access', () => ({ canUsePaidConversion: jest.fn() }));
jest.mock('@/lib/lead-engine', () => ({ openLeadModal: jest.fn() }));
jest.mock('@/lib/slug', () => ({ buildCompanyPath: () => '/companies/greenflux' }));

const company = {
  id: 42,
  name: 'GreenFlux',
  slug: 'greenflux',
  logo_url: null,
  description: 'Soluções de gestão inteligente de recarga para frotas elétricas.',
  city: 'Florianópolis',
  state: 'SC',
  rating_count: 0,
} as unknown as Company;

describe('SearchCompanyListCard desktop layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (canUsePaidConversion as jest.Mock).mockReturnValue(false);
  });

  it('uses two bounded information columns and a separate desktop action rail', () => {
    const { container } = render(<SearchCompanyListCard company={company} />);
    const card = container.querySelector('article');
    expect(card).toHaveClass('grid');
    expect(card).toHaveClass('lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.15fr)]');

    const actions = screen.getByTestId('search-card-desktop-actions');
    expect(actions).toHaveClass('lg:col-span-2', 'lg:flex');
    expect(screen.getByText(company.description!)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Comparar empresa' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Deixe sua avaliação de GreenFlux' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Ver perfil' })).toHaveLength(2);
    expect(screen.queryByText('Não informado')).not.toBeInTheDocument();
  });

  it('keeps company facts in one place, without duplicate response and coverage columns', () => {
    const withFacts = {
      ...company,
      coverage: 'Santa Catarina',
      response_time_sla: 'Até 24h',
    } as Company;
    render(<SearchCompanyListCard company={withFacts} />);
    expect(screen.getByText('Cobertura: Santa Catarina')).toBeInTheDocument();
    expect(screen.getByText('Respostas: Até 24h')).toBeInTheDocument();
  });

  it('retains quote entitlement, source and company identity on the desktop CTA', () => {
    (canUsePaidConversion as jest.Mock).mockReturnValue(true);
    render(<SearchCompanyListCard company={company} />);

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar orçamento' }));
    expect(openLeadModal).toHaveBeenCalledWith({
      preferredCompanyId: 42,
      source: 'search-list-card',
      type: 'quick',
    });
    expect(canUsePaidConversion).toHaveBeenCalledWith(company, 'quote');
  });

  it('keeps the reviews destination when the company has reviews', () => {
    render(<SearchCompanyListCard company={{ ...company, rating_count: 3 } as Company} />);
    const links = screen.getAllByRole('link', { name: 'Ver avaliações 3' });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/companies/greenflux#avaliacoes');
  });
});
