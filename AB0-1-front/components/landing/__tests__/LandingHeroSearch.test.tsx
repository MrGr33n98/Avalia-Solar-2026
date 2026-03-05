import { fireEvent, render, screen } from '@testing-library/react';

import { LandingHeroSearch } from '@/components/landing/LandingHeroSearch';
import type { Category } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/components/LocationSearch', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-location-search" />,
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

const CATEGORY_CACHE_KEY = 'avalia.home.categories.cache.v1';

const buildCategory = (overrides: Partial<Category>): Category =>
  ({
    id: 1,
    name: 'Categoria Teste',
    seo_url: 'categoria-teste',
    seo_title: 'Categoria Teste',
    kind: 'service',
    status: 'active',
    featured: true,
    logo: null,
    created_at: '2026-02-10T00:00:00Z',
    updated_at: '2026-02-10T00:00:00Z',
    ...overrides,
  } as Category);

describe('LandingHeroSearch', () => {
  beforeEach(() => {
    pushMock.mockReset();
    (track as jest.Mock).mockReset();
    window.localStorage.clear();
  });

  it('shows fallback categories when API data is unavailable', () => {
    render(<LandingHeroSearch categories={[]} />);

    expect(screen.getByRole('option', { name: 'Categorias em contingencia' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Energia Solar Residencial' })).toBeInTheDocument();
    expect(
      screen.getByText('Exibindo categorias de contingencia para manter a busca disponivel.')
    ).toBeInTheDocument();
  });

  it('prefers API categories and saves them to local cache', () => {
    const categories = [
      buildCategory({
        id: 321,
        name: 'Paineis Solares',
        seo_url: 'paineis-solares',
      }),
    ];

    render(<LandingHeroSearch categories={categories} />);

    expect(screen.getByRole('option', { name: 'O que voce procura?' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Paineis Solares' })).toBeInTheDocument();

    const cachedRaw = window.localStorage.getItem(CATEGORY_CACHE_KEY);
    expect(cachedRaw).toBeTruthy();
    expect(cachedRaw || '').toContain('Paineis Solares');
  });

  it('navigates using selected category slug', () => {
    const categories = [
      buildCategory({
        id: 777,
        name: 'Carregadores',
        seo_url: 'carregadores-veiculares',
      }),
    ];

    render(<LandingHeroSearch categories={categories} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '777' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar Empresas' }));

    expect(pushMock).toHaveBeenCalledWith('/categories/carregadores-veiculares');
  });

  it('tracks variant metadata in experiment mode', () => {
    const categories = [
      buildCategory({
        id: 999,
        name: 'Baterias',
        seo_url: 'baterias',
      }),
    ];

    render(
      <LandingHeroSearch
        categories={categories}
        heroVariant="variant"
        experimentId="home_hero_v1"
      />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar Empresas' }));

    expect(track).toHaveBeenCalledWith(
      'search_submitted',
      expect.objectContaining({
        hero_variant: 'variant',
        experiment_id: 'home_hero_v1',
      }),
      expect.any(Object)
    );
  });
});
