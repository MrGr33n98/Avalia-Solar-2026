import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import RecommendedCompanies from '@/components/compare/RecommendedCompanies';
import { mapCompanyToCompareCompany } from '@/components/compare/mapCompanyToCompareCompany';

const companies = Array.from({ length: 8 }, (_, index) =>
  mapCompanyToCompareCompany({
    id: index + 100,
    name: index === 0
      ? 'Cooperativa Regional de Energia Solar Fotovoltaica e Soluções Sustentáveis'
      : `Empresa Solar ${index + 1}`,
    category_name: 'Energia Solar',
    city: 'Florianópolis',
    state: 'SC',
    rating_avg: index === 7 ? 0 : 4.7,
    rating_count: index === 7 ? 0 : 10,
    verified: false,
  })
);

const actions = { onAdd: jest.fn(), onReplace: jest.fn(), onRetry: jest.fn() };

function renderGrid(overrides: Partial<React.ComponentProps<typeof RecommendedCompanies>> = {}) {
  return render(
    <RecommendedCompanies
      companies={companies}
      selectedCompanies={[]}
      maxComparison={2}
      loading={false}
      error={false}
      {...actions}
      {...overrides}
    />
  );
}

describe('RecommendedCompanies compact grid — PWA contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders 8 distinct recommendations in a two-column mobile grid', () => {
    renderGrid();

    const grid = screen.getByTestId('compare-recommendations-grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('xl:grid-cols-1');
    expect(within(grid).getAllByTestId('compare-recommendation-card')).toHaveLength(8);
    expect(within(grid).getAllByRole('button', { name: /^Adicionar / })).toHaveLength(8);
  });

  it('keeps name, category, city, conditional rating and touch targets', () => {
    renderGrid();
    const cards = screen.getAllByTestId('compare-recommendation-card');
    expect(within(cards[0]).getByText(companies[0].name)).toBeInTheDocument();
    expect(within(cards[0]).getByText('Energia Solar')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Florianópolis, SC')).toBeInTheDocument();
    expect(within(cards[0]).getByText('4,7')).toBeInTheDocument();
    expect(within(cards[7]).queryByText('0,0')).not.toBeInTheDocument();
    const button = within(cards[0]).getByRole('button', { name: `Adicionar ${companies[0].name}` });
    expect(button).toHaveClass('h-11');
    expect(button).toHaveClass('min-h-11');
    expect(button).toHaveClass('shrink-0');
  });

  it('does not change the selection limit or the add action', () => {
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: `Adicionar ${companies[0].name}` }));
    expect(actions.onAdd).toHaveBeenCalledWith(companies[0]);
    expect(actions.onReplace).not.toHaveBeenCalled();
  });

  it('offers replace instead of add when the two mobile slots are filled', () => {
    renderGrid({ selectedCompanies: companies.slice(0, 2) });
    const buttons = screen.getAllByRole('button', { name: /^Substituir por / });
    expect(buttons).toHaveLength(8);
    fireEvent.click(buttons[0]);
    expect(actions.onAdd).not.toHaveBeenCalled();
    expect(screen.getByText('Substituir qual empresa?')).toBeInTheDocument();
  });

  it('renders eight compact skeletons and full-width error and empty states', () => {
    const { rerender } = renderGrid({ loading: true });
    const grid = screen.getByTestId('compare-recommendations-grid');
    expect(within(grid).getAllByTestId('compare-recommendation-skeleton')).toHaveLength(8);

    rerender(
      <RecommendedCompanies
        companies={[]}
        selectedCompanies={[]}
        maxComparison={2}
        loading={false}
        error={true}
        {...actions}
      />
    );
    expect(screen.getByText('Não foi possível carregar recomendações.').parentElement).toHaveClass('col-span-full');
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));
    expect(actions.onRetry).toHaveBeenCalled();

    rerender(
      <RecommendedCompanies
        companies={[]}
        selectedCompanies={[]}
        maxComparison={2}
        loading={false}
        error={false}
        {...actions}
      />
    );
    expect(screen.getByText('Nenhuma recomendação disponível agora.')).toHaveClass('col-span-full');
  });
});
