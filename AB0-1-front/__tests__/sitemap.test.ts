import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import {
  getCompanySitemapEntries,
  getSitemapEntriesBySection,
  getSitemapIndexEntries,
  serializeSitemapIndex,
  SITEMAP_SECTIONS,
} from '@/lib/seo/sitemap-builders';
import { STATIC_SITEMAP_LAST_MODIFIED } from '@/lib/site';

describe('sitemap', () => {
  beforeEach(() => {
    if (!global.fetch) {
      Object.defineProperty(global, 'fetch', {
        value: jest.fn(),
        writable: true,
      });
    }

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('includes trust pages and omits auth routes', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://www.avaliasolar.com.br/about');
    expect(urls).toContain('https://www.avaliasolar.com.br/contact');
    expect(urls).toContain('https://www.avaliasolar.com.br/help');
    expect(urls).toContain('https://www.avaliasolar.com.br/press');
    expect(urls).toContain('https://www.avaliasolar.com.br/careers');
    expect(urls).toContain('https://www.avaliasolar.com.br/privacy');
    expect(urls).toContain('https://www.avaliasolar.com.br/terms');
    expect(urls).toContain('https://www.avaliasolar.com.br/cookies');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/login');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/register');

    const staticEntries = entries.filter((entry) =>
      [
        'https://www.avaliasolar.com.br/',
        'https://www.avaliasolar.com.br/blog',
        'https://www.avaliasolar.com.br/companies',
        'https://www.avaliasolar.com.br/products',
        'https://www.avaliasolar.com.br/about',
        'https://www.avaliasolar.com.br/contact',
        'https://www.avaliasolar.com.br/help',
        'https://www.avaliasolar.com.br/press',
        'https://www.avaliasolar.com.br/careers',
        'https://www.avaliasolar.com.br/privacy',
        'https://www.avaliasolar.com.br/terms',
        'https://www.avaliasolar.com.br/cookies',
      ].includes(entry.url)
    );

    expect(new Set(staticEntries.map((entry) => entry.lastModified)).size).toBe(1);
    expect(staticEntries[0].lastModified).toBe(STATIC_SITEMAP_LAST_MODIFIED);
  });

  it('exposes a sitemap index with every segmented sitemap', () => {
    const indexEntries = getSitemapIndexEntries();
    const indexXml = serializeSitemapIndex();

    expect(indexEntries).toHaveLength(SITEMAP_SECTIONS.length);
    SITEMAP_SECTIONS.forEach((section) => {
      expect(indexXml).toContain(`https://www.avaliasolar.com.br/sitemaps/${section}/sitemap.xml`);
    });
  });

  it('includes real company service URLs in a dedicated indexable sitemap', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      return {
        ok: true,
        json: async () => ({
          data: url.includes('sitemaps/services')
            ? [
                {
                  company_slug: 'empresa-teste',
                  service_slug: 'instalacao-bess',
                  updated_at: '2026-11-05T00:00:00Z',
                },
              ]
            : [],
        }),
      } as Response;
    });

    const entries = await getSitemapEntriesBySection('services');
    expect(entries.map((entry) => entry.url)).toContain(
      'https://www.avaliasolar.com.br/companies/empresa-teste/services/instalacao-bess'
    );
    expect(entries).toHaveLength(1);
  });

  it('paginates the company feed beyond the API limit of 100 records', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      name: `Empresa ${index + 1}`,
      slug: `empresa-${index + 1}`,
    }));
    const secondPage = [{ id: 101, name: 'Empresa 101', slug: 'empresa-101' }];

    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const page = new URL(String(input), 'http://localhost').searchParams.get('page');
      return {
        ok: true,
        status: 200,
        json: async () =>
          page === '1'
            ? { data: firstPage, meta: { pagination: { total_pages: 2, next_page: 2 } } }
            : { data: secondPage, meta: { pagination: { total_pages: 2, next_page: null } } },
      } as Response;
    });
    fetchMock.mockClear();

    const entries = await getCompanySitemapEntries();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(entries).toHaveLength(101);
    expect(entries.map((entry) => entry.url)).toContain(
      'https://www.avaliasolar.com.br/companies/empresa-101'
    );
  });

  it('falha explicitamente quando o feed de empresas está indisponível', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'unavailable' }),
    } as Response);

    await expect(getCompanySitemapEntries()).rejects.toThrow('HTTP 503');
  });

  it('keeps robots pointing to the sitemap index as the primary discovery source', () => {
    const robotsConfig = robots();

    expect(robotsConfig.sitemap).toEqual(['https://www.avaliasolar.com.br/sitemap-index.xml']);
  });

  it('generates the static segment without private or utility routes', async () => {
    const entries = await getSitemapEntriesBySection('static');
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://www.avaliasolar.com.br/');
    expect(urls).toContain('https://www.avaliasolar.com.br/companies');
    expect(urls).toContain('https://www.avaliasolar.com.br/help');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/search');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/compare');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/dashboard');
  });

  it('keeps weak local SEO pages out of the local sitemap segment', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({
          data: [
            {
              path: '/companies/energia-solar/sc/florianopolis',
              priority: 0.72,
            },
          ],
        }),
      } as Response;
    });

    const entries = await getSitemapEntriesBySection('local-solar');
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(
      'https://www.avaliasolar.com.br/companies/energia-solar/sc/florianopolis'
    );
    expect(urls).not.toContain('https://www.avaliasolar.com.br/companies/energia-solar/ac');
  });
});
