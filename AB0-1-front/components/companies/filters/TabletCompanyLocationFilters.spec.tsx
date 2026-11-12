import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TabletCompanyLocationFilters from '@/components/companies/filters/TabletCompanyLocationFilters';
import type { CompanyFilters } from '@/components/filters/types';

const mockFetchStates = jest.fn();
const mockFetchCities = jest.fn();

jest.mock('@/hooks/useCompanyLocationData', () => ({
  useCompanyLocationData: () => ({
    states: ['SP', 'RJ', 'MG', 'SC'],
    cities: ['Campinas', 'Piracicaba', 'São Paulo'],
    fetchStates: mockFetchStates,
    fetchCities: mockFetchCities,
    loadingCities: false,
    loadingStates: false,
  }),
}));

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

describe('TabletCompanyLocationFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders state and city selects for tablet/iPad view', () => {
    render(
      <TabletCompanyLocationFilters
        filters={baseFilters}
        onStateChange={jest.fn()}
        onCityChange={jest.fn()}
        onClearLocation={jest.fn()}
        onOpenNearMe={jest.fn()}
        onOpenFullFilters={jest.fn()}
      />
    );

    expect(screen.getByRole('combobox', { name: /Filtrar por estado/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Filtrar por cidade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Perto de mim/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument();
  });

  it('calls onStateChange when a state is selected', () => {
    const onStateChange = jest.fn();
    render(
      <TabletCompanyLocationFilters
        filters={baseFilters}
        onStateChange={onStateChange}
        onCityChange={jest.fn()}
        onClearLocation={jest.fn()}
        onOpenNearMe={jest.fn()}
        onOpenFullFilters={jest.fn()}
      />
    );

    const stateSelect = screen.getByRole('combobox', { name: /Filtrar por estado/i });
    fireEvent.change(stateSelect, { target: { value: 'SP' } });

    expect(onStateChange).toHaveBeenCalledWith('SP');
  });

  it('loads cities for the active state', async () => {
    render(
      <TabletCompanyLocationFilters
        filters={{ ...baseFilters, state: ['SP'] }}
        onStateChange={jest.fn()}
        onCityChange={jest.fn()}
        onClearLocation={jest.fn()}
        onOpenNearMe={jest.fn()}
        onOpenFullFilters={jest.fn()}
      />
    );

    await waitFor(() => expect(mockFetchCities).toHaveBeenCalledWith('SP'));
  });

  it('calls onCityChange when a city is selected', () => {
    const onCityChange = jest.fn();
    const filtersWithState: CompanyFilters = {
      ...baseFilters,
      state: ['SP'],
    };

    render(
      <TabletCompanyLocationFilters
        filters={filtersWithState}
        onStateChange={jest.fn()}
        onCityChange={onCityChange}
        onClearLocation={jest.fn()}
        onOpenNearMe={jest.fn()}
        onOpenFullFilters={jest.fn()}
      />
    );

    const citySelect = screen.getByRole('combobox', { name: /Filtrar por cidade/i });
    fireEvent.change(citySelect, { target: { value: 'Piracicaba' } });

    expect(onCityChange).toHaveBeenCalledWith('Piracicaba');
  });

  it('shows and handles Limpar local button when location is active', () => {
    const onClearLocation = jest.fn();
    const filtersWithLocation: CompanyFilters = {
      ...baseFilters,
      state: ['SP'],
      city: ['Piracicaba'],
    };

    render(
      <TabletCompanyLocationFilters
        filters={filtersWithLocation}
        onStateChange={jest.fn()}
        onCityChange={jest.fn()}
        onClearLocation={onClearLocation}
        onOpenNearMe={jest.fn()}
        onOpenFullFilters={jest.fn()}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /Limpar local/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onClearLocation).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenNearMe and onOpenFullFilters', () => {
    const onOpenNearMe = jest.fn();
    const onOpenFullFilters = jest.fn();

    render(
      <TabletCompanyLocationFilters
        filters={baseFilters}
        onStateChange={jest.fn()}
        onCityChange={jest.fn()}
        onClearLocation={jest.fn()}
        onOpenNearMe={onOpenNearMe}
        onOpenFullFilters={onOpenFullFilters}
        activeFiltersCount={3}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Perto de mim/i }));
    expect(onOpenNearMe).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    expect(onOpenFullFilters).toHaveBeenCalledTimes(1);
  });
});
