import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileCompanyFiltersSheet from '@/components/companies/filters/MobileCompanyFiltersSheet';
import { DEFAULT_FILTERS } from '@/components/filters/types';
import { CommunicationSurfaceManager } from '@/lib/communication-surface-manager';

// Mocks
jest.mock('@/hooks/useCompanyLocationData', () => ({
  useCompanyLocationData: () => ({
    states: ['SP', 'RJ', 'MG'],
    cities: ['São Paulo', 'Campinas'],
    fetchStates: jest.fn(),
    fetchCities: jest.fn(),
    loadingStates: false,
    loadingCities: false,
  }),
}));

jest.mock('@/hooks/useCompanyGeolocation', () => ({
  useCompanyGeolocation: () => ({
    detectingGps: false,
    gpsError: null,
    setGpsError: jest.fn(),
    getCoordinates: jest.fn(),
  }),
}));

jest.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      { id: 1, name: 'Instaladores Solares' },
      { id: 2, name: 'Engenharia Solar' },
    ],
    loading: false,
  }),
}));

jest.mock('@/hooks/useCategoriesTree', () => ({
  useCategoriesTree: () => ({
    categories: [
      { id: 1, name: 'Instaladores Solares', children: [] },
      { id: 2, name: 'Engenharia Solar', children: [] },
    ],
    loading: false,
    filterCategories: (cats: unknown) => cats,
  }),
}));

jest.mock('@/lib/api-client', () => ({
  companiesApiSafe: {
    getTotalCount: jest.fn().mockResolvedValue(42),
  },
}));

jest.mock('@/lib/analytics/consolidated', () => ({
  track: jest.fn(),
}));

describe('SaaS Side Filter Drawer — Responsive Geometry & Interactions', () => {
  it('renders via portal as a compact right-aligned drawer capped for desktop SaaS widths', () => {
    const handleClose = jest.fn();
    const handleApply = jest.fn();

    render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={handleClose}
        filters={DEFAULT_FILTERS}
        onApply={handleApply}
      />
    );

    const dialog = screen.getByRole('dialog', { name: /filtrar empresas/i });
    expect(dialog).toBeInTheDocument();

    // Mobile PWA width + Golden SaaS desktop cap (never half/70% of desktop screen)
    expect(dialog.className).toContain('w-[70vw]');
    expect(dialog.className).toContain('max-w-[360px]');
    expect(dialog.className).toContain('sm:w-[360px]');
    expect(dialog.className).toContain('lg:w-[380px]');
    expect(dialog.className).toContain('lg:max-w-[380px]');
    expect(dialog.className).toContain('rounded-l-2xl');
    expect(dialog.className).toContain('h-[100dvh]');

    // Verify Right-to-Left slide container positioning inside document.body portal
    const backdrop = screen.getByRole('presentation');
    expect(backdrop.parentElement).toBe(document.body);
    expect(backdrop.className).toContain('justify-end');
    expect(backdrop.className).toContain('bg-slate-950/35');
  });

  it('closes on backdrop click', () => {
    const handleClose = jest.fn();

    render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={handleClose}
        filters={DEFAULT_FILTERS}
        onApply={jest.fn()}
      />
    );

    const backdrop = screen.getByRole('presentation');
    fireEvent.mouseDown(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const handleClose = jest.fn();

    render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={handleClose}
        filters={DEFAULT_FILTERS}
        onApply={jest.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on close button (X) click', () => {
    const handleClose = jest.fn();

    render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={handleClose}
        filters={DEFAULT_FILTERS}
        onApply={jest.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /fechar filtros/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('registers filters_drawer on CommunicationSurfaceManager when open', () => {
    render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={jest.fn()}
        filters={DEFAULT_FILTERS}
        onApply={jest.fn()}
      />
    );
    expect(CommunicationSurfaceManager.active).toBe('filters_drawer');
  });

  it('displays real count from API on apply button', async () => {
    render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={jest.fn()}
        filters={DEFAULT_FILTERS}
        onApply={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ver 42 empresas/i })).toBeInTheDocument();
    });
  });

  it('toggles "Com avaliações" active visual and aria-pressed state properly', () => {
    const handleApply = jest.fn();

    render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={jest.fn()}
        filters={DEFAULT_FILTERS}
        onApply={handleApply}
      />
    );

    const hasReviewsBtn = screen.getByRole('button', { name: /com avaliações/i });
    expect(hasReviewsBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(hasReviewsBtn);
    expect(hasReviewsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(hasReviewsBtn.className).toContain('bg-blue-600');

    fireEvent.click(screen.getByRole('button', { name: /contando|aplicar filtros|ver/i }));
    expect(handleApply).toHaveBeenCalledWith(expect.objectContaining({ has_reviews: true }));
  });

  it('opens category sub-picker internally inside the drawer', async () => {
    render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={jest.fn()}
        filters={DEFAULT_FILTERS}
        onApply={jest.fn()}
      />
    );

    const categoryBtn = screen.getByRole('button', { name: /todas as categorias/i });
    fireEvent.click(categoryBtn);

    const categorySubDialog = screen.getByRole('dialog', { name: /selecionar categorias/i });
    expect(categorySubDialog).toBeInTheDocument();
    expect(categorySubDialog.className).toContain('absolute');
    expect(categorySubDialog.className).toContain('inset-0');
  });
});
