import { render, screen } from '@testing-library/react';
import { SearchResultsHeader } from './SearchResultsHeader';

describe('SearchResultsHeader', () => {
  it('shows the complete company count and hides irrelevant price sorting in company search', () => {
    render(
      <SearchResultsHeader
        query=""
        companiesCount={473}
        productsCount={0}
        reviewsCount={0}
        sort="relevance"
        onSortChange={jest.fn()}
        showPriceSort={false}
      />
    );
    expect(screen.getByText(/473 empresas encontradas/)).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Menor preço' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Melhor avaliação' })).toBeInTheDocument();
  });
});
