import { render, screen } from '@testing-library/react';
import { SearchFilters, defaultSearchFilters } from './SearchFilters';

const props = {
  value: defaultSearchFilters,
  counts: { all: 473, companies: 473, products: 0, reviews: 0 },
  categories: ['Energia Solar'],
  brands: ['Marca A'],
  onChange: jest.fn(),
  onReset: jest.fn(),
  onApply: jest.fn(),
};

describe('SearchFilters by result type', () => {
  it('does not show product-only brand and price controls on company results', () => {
    render(<SearchFilters {...props} activeTab="companies" />);
    expect(screen.getByText('Categoria')).toBeInTheDocument();
    expect(screen.getByText('Apenas verificados')).toBeInTheDocument();
    expect(screen.queryByText('Marca')).not.toBeInTheDocument();
    expect(screen.queryByText('Faixa de preço')).not.toBeInTheDocument();
  });

  it('preserves product-only controls on the mixed results tab', () => {
    render(<SearchFilters {...props} activeTab="all" />);
    expect(screen.getByText('Marca')).toBeInTheDocument();
    expect(screen.getByText('Faixa de preço')).toBeInTheDocument();
  });
});
