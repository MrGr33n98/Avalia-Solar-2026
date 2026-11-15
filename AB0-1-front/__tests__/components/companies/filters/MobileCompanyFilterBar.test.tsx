import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import MobileCompanyFilterBar, {
  compactCompanyLocationLabel,
} from '@/components/companies/filters/MobileCompanyFilterBar';
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

const defaultActions = () => ({
  onOpenFilters: jest.fn(),
  onOpenLocation: jest.fn(),
  onOpenCategory: jest.fn(),
  onToggleVerified: jest.fn(),
});

describe('MobileCompanyFilterBar — labels and mobile/PWA density', () => {
  it('preserves four buttons and all original actions', () => {
    const actions = defaultActions();
    render(
      <MobileCompanyFilterBar
        filters={baseFilters}
        locationLabel="Perto de mim"
        categoryLabel="Categoria"
        {...actions}
      />
    );

    const toolbar = screen.getByTestId('mobile-company-filter-bar');
    const buttons = within(toolbar).getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[0]).toHaveAccessibleName('Filtros');
    expect(buttons[1]).toHaveAccessibleName('Localização: Perto de mim');
    expect(buttons[2]).toHaveAccessibleName('Categoria: Categoria');
    expect(buttons[3]).toHaveAccessibleName('Verificadas');

    buttons.forEach((button, index) => fireEvent.click(button));
    expect(actions.onOpenFilters).toHaveBeenCalledTimes(1);
    expect(actions.onOpenLocation).toHaveBeenCalledTimes(1);
    expect(actions.onOpenCategory).toHaveBeenCalledTimes(1);
    expect(actions.onToggleVerified).toHaveBeenCalledTimes(1);
  });

  it('uses four fixed grid columns, explicit 44px touch targets, and no CSS ellipsis', () => {
    render(<MobileCompanyFilterBar filters={baseFilters} {...defaultActions()} />);

    const toolbar = screen.getByTestId('mobile-company-filter-bar');
    expect(toolbar).toHaveAttribute('id', 'mobile-company-filter-bar');
    expect(toolbar).toHaveClass('grid', 'min-w-0');
    expect(toolbar.className).toContain('grid-cols-[minmax(0,1.25fr)');
    expect(toolbar).not.toHaveClass('overflow-x-auto');

    within(toolbar).getAllByRole('button').forEach((button) => {
      expect(button).toHaveClass('h-11', 'min-h-11', 'w-full', 'min-w-0');
      expect(button).toHaveClass('whitespace-nowrap');
      expect(button.className).not.toContain('truncate');
    });

    const visibleTextVariants = [
      'location-label-narrow', 'location-label-wide',
      'category-label-narrow', 'category-label-wide',
      'verified-label-narrow', 'verified-label-wide',
    ];
    for (const testId of visibleTextVariants) {
      const label = screen.getByTestId(testId);
      expect(label).not.toHaveClass('truncate');
      expect(label).not.toHaveClass('text-ellipsis');
    }

    expect(screen.getByTestId('location-label-narrow')).toHaveTextContent('Local');
    expect(screen.getByTestId('location-label-wide')).toHaveTextContent('Perto');
    expect(screen.getByTestId('category-label-narrow')).toHaveTextContent('Cat.');
    expect(screen.getByTestId('category-label-wide')).toHaveTextContent('Categoria');
    expect(screen.getByTestId('verified-label-narrow')).toHaveTextContent('Verif.');
    expect(screen.getByTestId('verified-label-wide')).toHaveTextContent('Verificadas');
  });

  it('shows state abbreviations instead of truncating a long city label', () => {
    const filters: CompanyFilters = {
      ...baseFilters, state: ['SC'], city: ['Florianópolis'], category_ids: [74], verified: true,
    };
    render(
      <MobileCompanyFilterBar
        filters={filters}
        locationLabel="Florianópolis, SC"
        categoryLabel="Instalação e Manutenção de Energia Solar"
        {...defaultActions()}
      />
    );

    expect(screen.getByTestId('location-label-narrow')).toHaveTextContent('SC');
    expect(screen.getByTestId('location-label-wide')).toHaveTextContent('SC');
    expect(screen.getByRole('button', { name: 'Localização: Florianópolis, SC' })).toHaveAttribute(
      'title', 'Florianópolis, SC'
    );
    expect(screen.getByRole('button', { name: 'Categoria: Instalação e Manutenção de Energia Solar' }))
      .toHaveAttribute('title', 'Instalação e Manutenção de Energia Solar');
    expect(screen.getByRole('button', { name: 'Verificadas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('keeps the complete selected label accessible if a state abbreviation is unavailable', () => {
    render(
      <MobileCompanyFilterBar
        filters={{ ...baseFilters, city: ['Campinas'] }}
        locationLabel="Campinas"
        {...defaultActions()}
      />
    );
    expect(screen.getByTestId('location-label-wide')).toHaveTextContent('Local');
    expect(screen.getByRole('button', { name: 'Localização: Campinas' })).toBeInTheDocument();
  });

  it('correctly parses state abbreviations without guessing city names', () => {
    expect(compactCompanyLocationLabel('AL')).toBe('AL');
    expect(compactCompanyLocationLabel('Florianópolis, SC')).toBe('SC');
    expect(compactCompanyLocationLabel('Perto de mim')).toBeNull();
    expect(compactCompanyLocationLabel('Campinas')).toBeNull();
  });
});
