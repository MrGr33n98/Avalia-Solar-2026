import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { CategorySearch } from '@/components/categories/CategorySearch';
import { useCategorySearchTransition } from '@/hooks/useCategorySearchTransition';
import type { CategoryTreeNode } from '@/types';

const mockCategories: CategoryTreeNode[] = [
  {
    id: 1,
    name: 'Energia Solar Fotovoltaica',
    slug: 'energia-solar',
    parent_id: null,
    companies_count: 50,
    products_count: 10,
    children: [
      {
        id: 11,
        name: 'Inversores Solares',
        slug: 'inversores',
        parent_id: 1,
        companies_count: 20,
        products_count: 5,
        children: [],
      },
    ],
  },
  {
    id: 2,
    name: 'Mobilidade Elétrica',
    slug: 'mobilidade-eletrica',
    parent_id: null,
    companies_count: 30,
    products_count: 8,
    children: [],
  },
];

const mockFilter = (tree: CategoryTreeNode[], query: string): CategoryTreeNode[] => {
  if (!query) return tree;
  const q = query.toLowerCase();
  return tree.filter((node) => node.name.toLowerCase().includes(q));
};

describe('useCategorySearchTransition', () => {
  it('returns initial categories when search is empty', () => {
    const { result } = renderHook(() =>
      useCategorySearchTransition(mockCategories, mockFilter)
    );

    expect(result.current.searchTerm).toBe('');
    expect(result.current.isSearching).toBe(false);
    expect(result.current.filteredCategories).toHaveLength(2);
  });

  it('filters categories concurrently upon search change', () => {
    const { result } = renderHook(() =>
      useCategorySearchTransition(mockCategories, mockFilter)
    );

    act(() => {
      result.current.handleSearchChange('Mobilidade');
    });

    expect(result.current.searchTerm).toBe('Mobilidade');
    expect(result.current.filteredCategories).toHaveLength(1);
    expect(result.current.filteredCategories[0].name).toBe('Mobilidade Elétrica');
  });

  it('clears search properly', () => {
    const { result } = renderHook(() =>
      useCategorySearchTransition(mockCategories, mockFilter)
    );

    act(() => {
      result.current.handleSearchChange('Solar');
    });
    expect(result.current.filteredCategories).toHaveLength(1);

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchTerm).toBe('');
    expect(result.current.filteredCategories).toHaveLength(2);
  });
});

describe('CategorySearch Component', () => {
  it('renders search input with accessibility attributes', () => {
    render(<CategorySearch value="" onChange={jest.fn()} />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Buscar categoria...');
  });

  it('calls onChange when user types', () => {
    const handleChange = jest.fn();
    render(<CategorySearch value="" onChange={handleChange} />);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Baterias' } });

    expect(handleChange).toHaveBeenCalledWith('Baterias');
  });

  it('displays loading spinner when isSearching is true', () => {
    render(
      <CategorySearch
        value="Solar"
        isSearching={true}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Filtrando categorias...')).toBeInTheDocument();
  });

  it('renders clear button and triggers onClear when clicked', () => {
    const handleClear = jest.fn();
    render(
      <CategorySearch
        value="Inversores"
        onChange={jest.fn()}
        onClear={handleClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /limpar busca/i });
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);

    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
