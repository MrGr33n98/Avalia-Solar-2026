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

  it('fits the four quick filters into a single responsive row without horizontal clipping', () => {
    render(
      <MobileCompanyFilterBar
        filters={baseFilters}
        onOpenFilters={jest.fn()}
        onOpenLocation={jest.fn()}
        onOpenCategory={jest.fn()}
        onToggleVerified={jest.fn()}
        locationLabel="AL"
      />
    );

    const toolbar = screen.getByTestId('mobile-company-filter-bar');
    expect(toolbar).toHaveClass('grid');
    expect(toolbar.className).toContain('grid-cols-[minmax(0,1.05fr)');
    expect(toolbar).not.toHaveClass('overflow-x-auto');

    const chips = screen.getAllByRole('button');
    expect(chips).toHaveLength(4);
    chips.forEach((chip) => {
      expect(chip).toHaveClass('w-full', 'min-w-0', 'h-9');
      expect(chip).not.toHaveClass('shrink-0');
    });
    expect(screen.getByRole('button', { name: /Verificadas/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps long location and category names accessible while visually truncating labels', () => {
    render(
      <MobileCompanyFilterBar
        filters={baseFilters}
        onOpenFilters={jest.fn()}
        onOpenLocation={jest.fn()}
        onOpenCategory={jest.fn()}
        onToggleVerified={jest.fn()}
        locationLabel="Florianópolis, Santa Catarina"
        categoryLabel="Instalação e Manutenção de Energia Solar"
      />
    );

    expect(screen.getByTitle('Florianópolis, Santa Catarina')).toHaveClass('truncate', 'min-w-0');
    expect(screen.getByTitle('Instalação e Manutenção de Energia Solar')).toHaveClass('truncate', 'min-w-0');
    expect(screen.getByRole('button', { name: /Florianópolis, Santa Catarina/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Instalação e Manutenção de Energia Solar/i })).toBeInTheDocument();
  });
});
