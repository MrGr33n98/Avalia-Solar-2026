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

describe('PWA Side Filter Drawer — Specification & Geometry (Max Width 70%)', () => {
  it('renders as a right-aligned sliding drawer with w-[70vw] max-w-[70vw]', () => {
    const handleClose = jest.fn();
    const handleApply = jest.fn();

    const { container } = render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={handleClose}
        filters={DEFAULT_FILTERS}
        onApply={handleApply}
      />
    );

    const dialog = screen.getByRole('dialog', { name: /filtrar empresas/i });
    expect(dialog).toBeInTheDocument();

    // Verify Geometry and CSS tokens
    expect(dialog.className).toContain('w-[70vw]');
    expect(dialog.className).toContain('max-w-[70vw]');
    expect(dialog.className).toContain('rounded-l-[20px]');
    expect(dialog.className).toContain('h-[100dvh]');

    // Verify Right-to-Left slide container positioning
    const backdrop = container.firstChild as HTMLElement;
    expect(backdrop.className).toContain('justify-end');
    expect(backdrop.className).toContain('bg-black/40');
  });

  it('closes on backdrop click', () => {
    const handleClose = jest.fn();

    const { container } = render(
      <MobileCompanyFiltersSheet
        open={true}
        onClose={handleClose}
        filters={DEFAULT_FILTERS}
        onApply={jest.fn()}
      />
    );

    const backdrop = container.firstChild as HTMLElement;
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

  it('opens category sub-picker internally inside the 70vw drawer', async () => {
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
