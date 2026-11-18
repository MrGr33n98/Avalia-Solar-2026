import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import CompareTable from '@/components/compare/CompareTable';
import { mapCompanyToCompareCompany } from '@/components/compare/mapCompanyToCompareCompany';

const comparePageSource = fs.readFileSync(
  path.join(__dirname, '../../app/compare/page.tsx'),
  'utf8'
);

describe('PWA comparison discovery layout', () => {
  it('provides two compact selection slots and focuses the search from the add action', () => {
    expect(comparePageSource).toContain('maxComparison - companies.length');
    expect(comparePageSource).toContain('grid grid-cols-2 gap-2');
    expect(comparePageSource).toContain("document.getElementById('compare-company-search')");
    expect(comparePageSource).toContain('search?.focus({ preventScroll: true })');
  });

  it('places discovery before incomplete comparisons only on mobile', () => {
    expect(comparePageSource.indexOf('<CompanySearchPanel')).toBeLessThan(
      comparePageSource.indexOf('<RecommendedCompanies')
    );
    expect(comparePageSource).toContain("companies.length < 2 ? 'order-1 md:order-2'");
    expect(comparePageSource).toContain("companies.length < 2 ? 'order-2 md:order-1'");
    expect(comparePageSource).toContain('className="hidden md:block"><EmptyComparisonState />');
    expect(comparePageSource).toContain("companies.length === 1 ? 'hidden space-y-3.5 md:block'");
  });

  it('retains desktop comparison while shortening the mobile hero', () => {
    expect(comparePageSource).toContain(
      'Compare avaliações, confiança e serviços de até duas empresas.'
    );
    expect(comparePageSource).toContain(
      'Compare reputação, notas, garantias, cobertura e condições comerciais'
    );
    expect(comparePageSource).toContain('md:pb-12');
  });
});

describe('Responsive comparison criteria and data integrity', () => {
  const company = mapCompanyToCompareCompany({
    id: 321,
    name: 'Empresa de Teste',
    city: 'Florianópolis',
    state: 'SC',
    rating_avg: 0,
    rating_count: 0,
  });

  it('preserves zero reviews as a real number instead of absent data', () => {
    const { container } = render(
      <CompareTable
        companies={[company]}
        onRemove={jest.fn()}
        onQuote={jest.fn()}
      />
    );

    const row = screen.getByText('Total de avaliações').closest('tr');
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent('0');
    expect(screen.queryByText('Votos úteis')).not.toBeInTheDocument();

    expect(container.querySelector('colgroup')).toHaveClass('max-md:hidden');
    expect(container.querySelector('table')).toHaveClass('max-md:block');
  });

  it('keeps comparison sections and two value columns in the mobile grid', () => {
    const second = mapCompanyToCompareCompany({
      id: 322,
      name: 'Outra Empresa',
      city: 'São Paulo',
      state: 'SP',
      rating_avg: 4.4,
      rating_count: 8,
    });
    const { container } = render(
      <CompareTable
        companies={[company, second]}
        onRemove={jest.fn()}
        onQuote={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Avaliação geral/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(container.querySelector('thead tr')).toHaveClass('max-md:grid-cols-2');
    expect(
      container.querySelector('tbody[id="comparison-group-rating"] tr')
    ).toHaveClass('max-md:grid-cols-2');
  });
});
