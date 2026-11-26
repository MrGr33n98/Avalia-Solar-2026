import { getCompanySitemapEntries } from '@/lib/seo/sitemap-builders';

// Mock global fetch
const originalFetch = global.fetch;

describe('Company Sitemap Resilience (TEST-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('resolves companies from dedicated sitemaps feed in batches without timing out', async () => {
    const mockCompaniesPage1 = {
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        slug: `empresa-solar-${i + 1}`,
        name: `Empresa Solar ${i + 1}`,
        updated_at: '2026-11-20T10:00:00Z',
      })),
    };
    const mockCompaniesPage2 = {
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i + 501,
        slug: `empresa-solar-${i + 501}`,
        name: `Empresa Solar ${i + 501}`,
        updated_at: '2026-11-21T10:00:00Z',
      })),
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompaniesPage1,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompaniesPage2,
      } as any);

    const startTime = Date.now();
    const entries = await getCompanySitemapEntries();
    const duration = Date.now() - startTime;

    expect(entries.length).toBe(600);
    expect(entries[0].url).toContain('/companies/empresa-solar-1');
    expect(entries[599].url).toContain('/companies/empresa-solar-600');
    expect(duration).toBeLessThan(5000);
  });

  it('falls back to standard paginated companies endpoint when dedicated feed returns 404', async () => {
    const fallbackCompanies = {
      data: [
        { id: 99, slug: 'fallback-solar', name: 'Fallback Solar Ltda', updated_at: '2026-11-22T00:00:00Z' },
      ],
      meta: {
        pagination: { total_pages: 1, next_page: null },
      },
    };

    global.fetch = jest.fn()
      // First attempt to sitemaps/companies fails with 404
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any)
      // Fallback attempt to companies?status=active succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => fallbackCompanies,
      } as any);

    const entries = await getCompanySitemapEntries();

    expect(entries.length).toBe(1);
    expect(entries[0].url).toContain('/companies/fallback-solar');
  });
});

