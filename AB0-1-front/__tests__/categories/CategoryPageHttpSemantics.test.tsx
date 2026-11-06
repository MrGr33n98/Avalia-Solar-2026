import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryPageServer from '@/app/categories/[slug]/CategoryPageServer';
import CategorySlugPage, { generateMetadata } from '@/app/categories/[slug]/page';
import CategorySolutionsPage from '@/app/categories/[slug]/solutions/page';
import CategoryComparePage from '@/app/categories/[slug]/compare/page';
import CategoryMatchingPage from '@/app/categories/[slug]/matching/page';
import CategorySlugError from '@/app/categories/[slug]/error';
import {
  CategoryUpstreamError,
  CategoryTimeoutError,
} from '@/lib/server/category-discovery/get-public-category';

const mockNotFound = jest.fn(() => {
  const err = new Error('NEXT_NOT_FOUND');
  (err as Error & { digest?: string }).digest = 'NEXT_NOT_FOUND';
  throw err;
});

const mockRedirect = jest.fn((url: string) => {
  const err = new Error(`NEXT_REDIRECT:${url}`);
  throw err;
});

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  redirect: (url: string) => mockRedirect(url),
  permanentRedirect: (url: string) => mockRedirect(url),
}));

const mockGetCachedPublicCategory = jest.fn();
jest.mock('@/lib/server/category-discovery/get-public-category', () => {
  const actual = jest.requireActual('@/lib/server/category-discovery/get-public-category');
  return {
    ...actual,
    getCachedPublicCategory: (...args: unknown[]) => mockGetCachedPublicCategory(...args),
  };
});

jest.mock('@/lib/api-public', () => ({
  publicCategoriesApi: {
    getCompaniesPaginated: jest.fn().mockResolvedValue({ companies: [], meta: null }),
    getBanners: jest.fn().mockResolvedValue([]),
    getSolutionTypes: jest.fn().mockResolvedValue([]),
  },
  publicBannersApi: {
    getByPosition: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/app/categories/[slug]/CategoryPageClientV2', () => {
  return function MockCategoryPageClientV2({ initialCategory }: { initialCategory: { name: string } }) {
    return <div data-testid="category-client-v2">{initialCategory.name}</div>;
  };
});

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

describe('J04 / CDSI-012..CDSI-018: Semântica HTTP de rotas de categoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('chama notFound() antes do streaming quando a categoria não existe (404 real, nunca soft-404 200)', async () => {
    mockGetCachedPublicCategory.mockResolvedValue({ status: 'not_found' });

    await expect(
      CategorySlugPage({ params: { slug: 'slug-inexistente' }, searchParams: {} })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it('chama notFound() em CategoryPageServer quando status é not_found', async () => {
    mockGetCachedPublicCategory.mockResolvedValue({ status: 'not_found' });

    await expect(
      CategoryPageServer({ params: { slug: 'slug-inexistente' }, searchParams: {} })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it('propaga CategoryUpstreamError em falha 5xx para acionar error boundary (nunca vira 404 nem renderiza erro 200)', async () => {
    mockGetCachedPublicCategory.mockRejectedValue(
      new CategoryUpstreamError('Falha temporária ao consultar serviço de categorias', 503)
    );

    await expect(
      CategorySlugPage({ params: { slug: 'inversores-solares' }, searchParams: {} })
    ).rejects.toThrow(CategoryUpstreamError);

    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('propaga CategoryTimeoutError em timeout da API para acionar error boundary', async () => {
    mockGetCachedPublicCategory.mockRejectedValue(
      new CategoryTimeoutError('Timeout ao consultar categoria')
    );

    await expect(
      CategorySlugPage({ params: { slug: 'inversores-solares' }, searchParams: {} })
    ).rejects.toThrow(CategoryTimeoutError);

    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('generateMetadata usa canonical do DTO publicado (seo_url) e marca noindex quando 404', async () => {
    mockGetCachedPublicCategory.mockResolvedValueOnce({ status: 'not_found' });
    const notFoundMeta = await generateMetadata({
      params: { slug: 'inexistente' },
      searchParams: {},
    });
    expect(notFoundMeta.robots).toEqual({ index: false, follow: false });

    mockGetCachedPublicCategory.mockResolvedValueOnce({
      status: 'ok',
      category: {
        id: 7,
        name: 'Monitoramento e O&M',
        seo_url: 'monitoramento-operacao-manutencao',
        seo_title: 'Monitoramento e O&M Solar',
        short_description: 'Descrição curta válida para SEO',
      },
    });
    const okMeta = await generateMetadata({
      params: { slug: 'monitoramento-operacao-manutencao' },
      searchParams: {},
    });
    expect(okMeta.alternates?.canonical).toContain(
      '/categories/monitoramento-operacao-manutencao'
    );

    mockGetCachedPublicCategory.mockResolvedValueOnce({
      status: 'ok',
      category: {
        id: 8,
        name: 'Categoria Enforced Noindex',
        seo_url: 'categoria-enforced-noindex',
        indexability: {
          publicly_accessible: true,
          indexable: false,
          include_in_sitemap: false,
          robots_directive: 'noindex,follow',
          canonical_slug: 'categoria-enforced-noindex',
          canonical_path: '/categories/categoria-enforced-noindex',
          reason_codes: ['empty_without_editorial_utility'],
          advisory_warnings: ['empty_without_editorial_utility'],
          mode: 'enforced',
        },
      },
    });
    const policyNoindexMeta = await generateMetadata({
      params: { slug: 'categoria-enforced-noindex' },
      searchParams: {},
    });
    expect(policyNoindexMeta.robots).toEqual({ index: false, follow: true });
  });

  it('CDSI-018: rotas auxiliares (solutions, compare, matching) chamam notFound() quando categoria não existe', async () => {
    mockGetCachedPublicCategory.mockResolvedValue({ status: 'not_found' });

    await expect(
      CategorySolutionsPage({ params: { slug: 'inexistente' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    await expect(
      CategoryComparePage({ params: { slug: 'inexistente' }, searchParams: {} })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    await expect(
      CategoryMatchingPage({ params: { slug: 'inexistente' }, searchParams: {} })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalledTimes(3);
  });

  it('CDSI-015: error boundary de /categories/[slug] não vaza mensagem técnica da exceção', () => {
    const internalError = new Error(
      'PG::ConnectionBad: connection to server at "10.0.0.12" failed'
    ) as Error & { digest?: string };
    internalError.digest = 'req-abc-123';

    render(<CategorySlugError error={internalError} reset={jest.fn()} />);

    expect(
      screen.getByRole('heading', { name: /Indisponibilidade temporária/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/PG::ConnectionBad/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/10\.0\.0\.12/)).not.toBeInTheDocument();
    expect(screen.getByText(/req-abc-123/)).toBeInTheDocument();
  });
});

