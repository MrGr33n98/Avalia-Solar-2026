/**
 * Unit checks for the actual public server loaders. No production API calls.
 * These tests complement (not replace) browser + Lighthouse acceptance checks.
 */
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({ ...jest.requireActual('react'), cache: (fn: unknown) => fn }));
jest.mock('@/lib/api-public', () => ({
  fetchApiPublic: jest.fn(),
  publicCompaniesApi: { getAllPaginated: jest.fn(), getAll: jest.fn() },
  publicReviewsApi: { getAll: jest.fn() },
}));

jest.mock('@/lib/seo/company-jsonld', () => ({
  buildCompanyLocalBusinessJsonLd: jest.fn(({ company, reviews }) => ({
    '@type': 'LocalBusiness',
    name: company.name,
    review: reviews,
  })),
}));
import { fetchApiPublic, publicCompaniesApi, publicReviewsApi } from '@/lib/api-public';
import CompanyReviewsSection from '@/app/companies/[id]/components/CompanyReviewsSection';
import { getInitialSearch } from '@/lib/server/performance/search';
import { getInitialProducts } from '@/lib/server/performance/products';
import { getInitialCompaniesPage } from '@/lib/server/performance/companies';

const fetchMock = fetchApiPublic as jest.Mock;
const companiesMock = publicCompaniesApi.getAllPaginated as jest.Mock;
const companiesListMock = publicCompaniesApi.getAll as jest.Mock;
const reviewsMock = publicReviewsApi.getAll as jest.Mock;

import { buildCompanyLocalBusinessJsonLd } from '@/lib/seo/company-jsonld';

beforeEach(() => {
  jest.resetAllMocks();
  // resetAllMocks clears factory implementations; reinstall the schema function.
  (buildCompanyLocalBusinessJsonLd as jest.Mock).mockImplementation(({ company, reviews }) => ({
    '@type': 'LocalBusiness',
    name: company.name,
    review: reviews,
  }));
});

describe('Server-first public loaders', () => {
  it('uses the shared default search size (24) and normalizes invalid pagination', async () => {
    fetchMock.mockResolvedValue({ companies: [{ id: 1 }], products: [], categories: [], articles: [] });
    const result = await getInitialSearch('q=solar&page=-1&per_page=500');
    expect(result?.companies).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith('search/all', expect.objectContaining({
      params: expect.objectContaining({ q: 'solar', page: 1, per_page: 24 }),
      revalidate: 60,
    }));
  });

  it('retains legacy empty query search fallback where no matches were returned', async () => {
    fetchMock.mockResolvedValue({ companies: [], products: [], categories: [], articles: [] });
    companiesListMock.mockResolvedValue([]);
    await expect(getInitialSearch('q=no-matches')).resolves.toBeNull();
  });

  it('preserves the public companies fallback even when products were found', async () => {
    fetchMock.mockResolvedValue({ companies: [], products: [{ id: 77 }], categories: [], articles: [] });
    companiesListMock.mockResolvedValue([{ id: 42, name: 'Empresa Solar' }]);
    const result = await getInitialSearch('q=weg');
    expect(result?.companies).toMatchObject([{ id: 42 }]);
    expect(result?.counts?.companies).toBe(1);
    expect(companiesListMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'weg', fields: 'card', status: 'active' }),
      expect.anything(),
    );
  });

  it('sends only first-render DTO fields rather than duplicated nested results', async () => {
    fetchMock.mockResolvedValue({
      companies: [{ id: 42 }], products: [], categories: [], articles: [],
      results: { companies: [{ id: 42 }], products: [], categories: [], articles: [] },
      debug: { private_data: 'should-never-be-serialized' },
    });
    const result = await getInitialSearch('q=solar');
    expect(result?.companies).toMatchObject([{ id: 42 }]);
    expect(result).not.toHaveProperty('results');
    expect(result).not.toHaveProperty('debug');
  });

  it('does not serialize wrong cards for a nonnumeric catalog deep link', async () => {
    await expect(getInitialProducts('category=not-a-numeric-id')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps page from URL and public filters for products', async () => {
    fetchMock.mockImplementation((path: string) => path === 'products'
      ? Promise.resolve({ data: [{ id: 1 }], meta: { total: 24, total_pages: 2 } })
      : Promise.resolve({ filters: [], categories: [] }));
    const result = await getInitialProducts('search=painel&page=2&category_id=4');
    expect(result?.meta.page).toBe(2);
    expect(result?.data).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith('products', expect.objectContaining({
      params: expect.objectContaining({ page: 2, category_id: 4, q: 'painel' }),
    }));
  });

  it('reuses existing public card endpoint; rejects unsupported filters without wrong SSR data', async () => {
    companiesMock.mockResolvedValue({ data: [{ id: 1, name: 'Empresa Teste' }], meta: { pagination: { total: 1 } } });
    await expect(getInitialCompaniesPage('state=SC&page=2')).resolves.toMatchObject({
      data: [{ id: 1 }],
    });
    expect(companiesMock).toHaveBeenCalledWith(
      expect.objectContaining({ fields: 'card', state: ['SC'], page: 2 }),
      expect.objectContaining({ tags: ['companies'] }),
    );
    companiesMock.mockClear();
    await expect(getInitialCompaniesPage('whatsapp_enabled=true')).resolves.toBeNull();
    expect(companiesMock).not.toHaveBeenCalled();
  });

  it('streams the same review-enriched JSON-LD when reviews are available', async () => {
    reviewsMock.mockResolvedValue([{ id: 3, rating: 5, body: 'Ótima experiência' }]);
    const company = { id: 1, name: 'Empresa Teste' } as any;
    const element = await CompanyReviewsSection({ company, canonicalUrl: 'https://www.avaliasolar.com.br/companies/teste' });
    expect(reviewsMock).toHaveBeenCalledWith(
      { company_id: 1, limit: 6 },
      expect.objectContaining({ revalidate: 600, tags: ['company-reviews', 'company-1'] }),
    );
    expect(JSON.parse(element.props.dangerouslySetInnerHTML.__html).review).toHaveLength(1);
  });

  it('continues rendering company aggregate schema when reviews fail', async () => {
    reviewsMock.mockRejectedValue(new Error('503'));
    const element = await CompanyReviewsSection({
      company: { id: 1, name: 'Empresa Teste' } as any,
      canonicalUrl: 'https://www.avaliasolar.com.br/companies/teste',
    });
    expect(JSON.parse(element.props.dangerouslySetInnerHTML.__html).review).toEqual([]);
  });

  it('does not convert network failures into fake SSR results', async () => {
    fetchMock.mockRejectedValue(new Error('503'));
    companiesMock.mockRejectedValue(new Error('503'));
    await expect(getInitialSearch('q=solar')).resolves.toBeNull();
    await expect(getInitialProducts('search=solar')).resolves.toBeNull();
    await expect(getInitialCompaniesPage('state=MT')).resolves.toBeNull();
  });
});
