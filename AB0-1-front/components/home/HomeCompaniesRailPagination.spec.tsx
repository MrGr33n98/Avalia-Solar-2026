import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Company } from '@/lib/api';
import { HomeCompaniesRail } from './HomeCompaniesRail';
import { publicCompaniesApi } from '@/lib/api-public';

jest.mock('@/lib/api-public', () => ({
  publicCompaniesApi: {
    getAllPaginated: jest.fn(),
  },
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
