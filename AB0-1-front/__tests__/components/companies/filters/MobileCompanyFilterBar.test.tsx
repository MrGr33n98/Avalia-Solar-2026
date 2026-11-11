import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileCompanyFilterBar from '@/components/companies/filters/MobileCompanyFilterBar';
import type { CompanyFilters } from '@/components/filters/types';

const baseFilters: CompanyFilters = {
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

describe('MobileCompanyFilterBar', () => {
  it('renders all filter action chips with accessible targets', () => {
    const onOpenFilters = jest.fn();
    const onOpenLocation = jest.fn();
    const onOpenCategory = jest.fn();
    const onToggleVerified = jest.fn();

    render(
      <MobileCompanyFilterBar
        filters={baseFilters}
        onOpenFilters={onOpenFilters}
        onOpenLocation={onOpenLocation}
        onOpenCategory={onOpenCategory}
        onToggleVerified={onToggleVerified}
        locationLabel="Perto de mim"
        categoryLabel="Categoria"
      />
    );

    const filtersBtn = screen.getByRole('button', { name: /Filtros/i });
    const locationBtn = screen.getByRole('button', { name: /Perto de mim/i });
    const categoryBtn = screen.getByRole('button', { name: /Categoria/i });
    const verifiedBtn = screen.getByRole('button', { name: /Verificadas/i });

    expect(filtersBtn).toBeInTheDocument();
    expect(locationBtn).toBeInTheDocument();
    expect(categoryBtn).toBeInTheDocument();
    expect(verifiedBtn).toBeInTheDocument();

    fireEvent.click(filtersBtn);
    expect(onOpenFilters).toHaveBeenCalledTimes(1);

    fireEvent.click(locationBtn);
    expect(onOpenLocation).toHaveBeenCalledTimes(1);

    fireEvent.click(categoryBtn);
    expect(onOpenCategory).toHaveBeenCalledTimes(1);

    fireEvent.click(verifiedBtn);
    expect(onToggleVerified).toHaveBeenCalledTimes(1);
  });

  it('renders active count and highlights when filters are active', () => {
    const activeFilters: CompanyFilters = {
      ...baseFilters,
      state: ['SP'],
      verified: true,
      category_ids: [1],
    };

    render(
      <MobileCompanyFilterBar
        filters={activeFilters}
        onOpenFilters={jest.fn()}
        onOpenLocation={jest.fn()}
        onOpenCategory={jest.fn()}
        onToggleVerified={jest.fn()}
      />
    );

    // Active groups: state (1) + verified (1) + category_ids (1) = 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
