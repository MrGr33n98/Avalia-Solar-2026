import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Company } from '@/lib/api';
import { HomeCompaniesRail } from './HomeCompaniesRail';
import { publicCompaniesApi } from '@/lib/api-public';
import { LocationProvider } from '@/contexts/LocationContext';
import { companiesApiSafe } from '@/lib/api-client';

jest.mock('@/lib/api-public', () => ({
  publicCompaniesApi: {
    getAllPaginated: jest.fn(),
  },
}));

jest.mock('@/lib/api-client', () => ({
  ...jest.requireActual('@/lib/api-client'),
  companiesApiSafe: { ...jest.requireActual('@/lib/api-client').companiesApiSafe, getCities: jest.fn() },
}));

jest.mock('@/lib/analytics/consolidated', () => ({
  track: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock('@/components/company/CompanyVerifiedBadge', () => ({
  CompanyVerifiedBadge: () => <span aria-label="Empresa verificada" />,
}));

jest.mock('@/components/favorites/FavoriteButton', () => ({
  FavoriteButton: () => <button type="button" aria-label="Favoritar empresa" />,
}));

jest.mock('@/components/ComparisonToggleButton', () => ({
  __esModule: true,
  default: () => <button type="button">Comparar</button>,
}));

jest.mock('@/lib/slug', () => ({
  buildCompanyPath: (_slug: string, _name: string, id: number) => `/companies/${id}`,
}));

function makeCompany(id: number, name: string, state = 'PB'): Company {
  return {
    id,
    slug: `empresa-${id}`,
    name,
    city: 'João Pessoa',
    state,
    status: 'active',
    verified: true,
    category: 'Energia solar',
  } as Company;
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('HomeCompaniesRail - Paginação de Empresas em Destaque', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza os botões de paginação quando existem múltiplas páginas para o estado', async () => {
    const page1Companies = Array.from({ length: 9 }, (_, i) =>
      makeCompany(i + 1, `Empresa PB ${i + 1}`, 'PB')
    );

    (publicCompaniesApi.getAllPaginated as jest.Mock).mockResolvedValueOnce({
      data: page1Companies,
      meta: {
        pagination: {
          page: 1,
          per_page: 9,
          total: 24,
          total_pages: 3,
        },
      },
    });

    renderWithClient(
      <HomeCompaniesRail
        companies={page1Companies}
        stateCode="PB"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: 'Navegação entre páginas de empresas em destaque' })
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Página/)).toBeInTheDocument();
    expect(screen.getByText('• 24 empresas')).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: 'Página anterior' });
    const nextButton = screen.getByRole('button', { name: 'Próxima página' });

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();
  });

  it('permite navegar para a próxima página e carrega novos registros', async () => {
    const page1Companies = Array.from({ length: 9 }, (_, i) =>
      makeCompany(i + 1, `Empresa PB ${i + 1}`, 'PB')
    );
    const page2Companies = Array.from({ length: 9 }, (_, i) =>
      makeCompany(i + 10, `Empresa PB ${i + 10}`, 'PB')
    );

    (publicCompaniesApi.getAllPaginated as jest.Mock)
      .mockResolvedValueOnce({
        data: page1Companies,
        meta: {
          pagination: {
            page: 1,
            per_page: 9,
            total: 24,
            total_pages: 3,
          },
        },
      })
      .mockResolvedValueOnce({
        data: page2Companies,
        meta: {
          pagination: {
            page: 2,
            per_page: 9,
            total: 24,
            total_pages: 3,
          },
        },
      });

    renderWithClient(
      <HomeCompaniesRail
        companies={page1Companies}
        stateCode="PB"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Próxima página' })).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: 'Próxima página' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(publicCompaniesApi.getAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          serves_state: 'PB',
          page: 2,
          per_page: 9,
        }),
        expect.anything()
      );
    });

    await waitFor(() => {
      expect(screen.getByTitle('Empresa PB 10')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeEnabled();
  });

  it('não renderiza barra de navegação quando existe apenas uma página', async () => {
    const singlePageCompanies = [
      makeCompany(1, 'Empresa Única PB', 'PB'),
    ];

    (publicCompaniesApi.getAllPaginated as jest.Mock).mockResolvedValueOnce({
      data: singlePageCompanies,
      meta: {
        pagination: {
          page: 1,
          per_page: 9,
          total: 1,
          total_pages: 1,
        },
      },
    });

    renderWithClient(
      <HomeCompaniesRail
        companies={singlePageCompanies}
        stateCode="PB"
      />
    );

    await waitFor(() => {
      expect(screen.getByTitle('Empresa Única PB')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('navigation', { name: 'Navegação entre páginas de empresas em destaque' })
    ).not.toBeInTheDocument();
  });
});

describe('HomeCompaniesRail — filtros geográficos PWA', () => {
  const originalMatchMedia = window.matchMedia;
  const originalUrl = window.location.pathname + window.location.search;
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    document.cookie = 'user_state=; path=/; max-age=0';
    document.cookie = 'user_city=; path=/; max-age=0';
    window.history.replaceState({}, '', '/');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true, writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 639px)', media: query,
        addEventListener: jest.fn(), removeEventListener: jest.fn(),
      })),
    });
    (companiesApiSafe.getCities as jest.Mock).mockImplementation(async (state: string) =>
      state === 'MT' ? ['Cuiabá', 'Rondonópolis'] : ['Florianópolis', 'Joinville']
    );
    (publicCompaniesApi.getAllPaginated as jest.Mock).mockImplementation(async (params) => ({
      data: params.state === 'SC' && params.city === 'Florianópolis' ? [] : [makeCompany(42, 'Solar MT', 'MT')],
      meta: { pagination: { page: 1, total_pages: 1, total: 1 } },
    }));
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: originalMatchMedia });
    window.localStorage.clear();
    document.cookie = 'user_state=; path=/; max-age=0';
    document.cookie = 'user_city=; path=/; max-age=0';
    window.history.replaceState({}, '', originalUrl);
  });

  it('aplica UF/cidade, limpa a cidade ao trocar UF e preserva os filtros em Ver todas, sem fallback nacional', async () => {
    renderWithClient(
      <LocationProvider defaultState="MT">
        <HomeCompaniesRail companies={[makeCompany(42, 'Solar MT', 'MT')]} />
      </LocationProvider>
    );
    const bar = screen.getByTestId('home-geo-filter-bar');
    expect(bar).toHaveClass('row-start-2', 'h-8', 'sm:hidden');
    expect(companiesApiSafe.getCities).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar estado' }));
    const state = screen.getByRole('combobox', { name: 'Estado' });
    const city = screen.getByRole('combobox', { name: 'Cidade' });
    await screen.findByRole('option', { name: 'Cuiabá' });
    fireEvent.change(city, { target: { value: 'Cuiabá' } });
    fireEvent.change(state, { target: { value: 'SC' } });
    expect(city).toHaveValue('');
    expect(screen.queryByRole('option', { name: 'Cuiabá' })).not.toBeInTheDocument();
    await screen.findByRole('option', { name: 'Florianópolis' });
    fireEvent.change(city, { target: { value: 'Florianópolis' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => {
      expect(publicCompaniesApi.getAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'SC', city: 'Florianópolis', page: 1 }),
        expect.anything()
      );
    });
    expect(await screen.findByText('Nenhuma empresa encontrada nesta localização. Altere os filtros.')).toBeInTheDocument();
    expect(screen.queryByTitle('Solar MT')).not.toBeInTheDocument();
    const href = screen.getByRole('link', { name: /Ver todas/i }).getAttribute('href') || '';
    const url = new URL(href, window.location.origin);
    expect(url.searchParams.get('state')).toBe('SC');
    expect(url.searchParams.get('city')).toBe('Florianópolis');
    expect(window.localStorage.getItem('user_city')).toBe('Florianópolis');
    expect(screen.getByRole('button', { name: 'Selecionar cidade' })).toHaveTextContent('Florianópolis');
  });

  it('não consulta cidades nem abre o seletor antes da interação', () => {
    renderWithClient(
      <LocationProvider defaultState="MT">
        <HomeCompaniesRail companies={[makeCompany(42, 'Solar MT', 'MT')]} />
      </LocationProvider>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(companiesApiSafe.getCities).not.toHaveBeenCalled();
  });
});
