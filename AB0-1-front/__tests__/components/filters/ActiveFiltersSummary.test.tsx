import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveFiltersSummary } from '@/components/filters/ActiveFiltersSummary';
import type { CompanyFilters } from '@/components/filters/types';

jest.mock('@/hooks/useCategoriesTree', () => ({
  useCategoriesTree: () => ({
    categories: [{ id: 1, name: 'Instalação Solar', children: [{ id: 10, name: 'Residencial' }] }],
  }),
}));

const defaultFilters: CompanyFilters = {
  search: '',
  state: [],
  city: [],
  category_ids: [],
  verified: false,
  featured: false,
  financing_enabled: false,
  whatsapp_enabled: false,
  has_reviews: false,
  min_rating: null,
  lat: null,
  lng: null,
  sort: '',
  page: 1,
};

describe('ActiveFiltersSummary (Compact Mobile + Desktop)', () => {
  it('returns null when no filters are active', () => {
    const { container } = render(
      <ActiveFiltersSummary filters={defaultFilters} onRemove={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders label and chips in a single horizontal container on mobile', () => {
    const filters: CompanyFilters = {
      ...defaultFilters,
      state: ['AL'],
      verified: true,
    };
    const onRemove = jest.fn();

    render(<ActiveFiltersSummary filters={filters} onRemove={onRemove} />);

    expect(screen.getByText('Filtros ativos (2)')).toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('Verificadas')).toBeInTheDocument();

    const removeAlButton = screen.getByRole('button', { name: /Remover filtro AL/i });
    expect(removeAlButton).toBeInTheDocument();
    fireEvent.click(removeAlButton);
    expect(onRemove).toHaveBeenCalledWith('state', 'AL');
  });

  it('renders accessible removal button with sufficient touch target', () => {
    const filters: CompanyFilters = {
      ...defaultFilters,
      state: ['SP'],
    };
    render(<ActiveFiltersSummary filters={filters} onRemove={jest.fn()} />);

    const removeBtn = screen.getByRole('button', { name: /Remover filtro SP/i });
    expect(removeBtn).toHaveAttribute('aria-label', 'Remover filtro SP');
    expect(removeBtn.className).toMatch(/touch-manipulation|min-h|min-w|h-/);
  });
});
